// Trackball algorith to translate X,Y mouse position on canvas into a position in 3 space on
// a unit sphere. Then we take the new mouse position and use a projection onto the sphere to
// calculate the rotation in X,Y,Z on the sphere.


// Find the top left corner of the canvas using the algorithm taken from
// http://quirksmode.org/js/findpos.html. Returns X and Y position in an array.

var canvasHeight;
var canvasWidth;

function findPos(obj) 
{
	var curleft = curtop = 0;
//	console.log("obj "+obj);
	if (obj.offsetParent) {
	do 
	{
		curleft += obj.offsetLeft;
		curtop += obj.offsetTop;
	} while (obj = obj.offsetParent);
	return [curleft,curtop];
	}
}

//this function is called from mouseMove in main.js only after a middle click has already been detected
function mouseMoveFreeRotate(event)
{
	//Calculate height and width from canvas size and top left corner
	canvasHeight=event.currentTarget.height;
	canvasWidth=event.currentTarget.width;
	//determine vector in 3space from 2D mouse position for original middle click
	var originalVectorPos = calculateTrackballVector(originalXPos,originalYPos,canvasWidth,canvasHeight);
//	console.log("originalVectorPos= "+originalVectorPos);
	//find the current positiion of the mouse wrt the origin of the canvas
	var currentXPos=event.clientX - canvasStartPosX;
	var currentYPos=event.clientY - canvasStartPosY;
	//determine current vector in 3space from 2D mouse position
	var currentVectorPos = calculateTrackballVector(currentXPos,currentYPos,canvasWidth,canvasHeight);
//	console.log("currentVectorPos= "+currentVectorPos);
	var axisAndAngle = calculateRotationAxisAngle(originalVectorPos,currentVectorPos);
	orbitCamera(new Array(0,0,0),axisAndAngle[0],axisAndAngle[1]);
	// Set the original position to the current position ready for next run
	originalXPos = currentXPos;
	originalYPos = currentYPos;
}

function calculateTrackballVector(xpos,ypos,canvasWidth,canvasHeight)
{
	// Set up bounds [0,0] to [2,2] and locate cursor in this coord system
	var x = xpos/(canvasWidth/2);
	var y = ypos/(canvasHeight/2);
	// Translate X coord relative to center of canvas
	x = x-1;
//	console.log("x is= "+x);
	//Flip Y and translate relative to center of canvas
	y=1-y;
//	console.log("y is= "+y);
	// We now have the x and y position of the sphere
	// all we need to do is calculate Z using the distance formula
	// sqrt(z^2+z^2+y^2)=1 Z^2=1-x^2-y^2 Z=sqrt(1-x^2-y^2)
	var z2=1-x*x-y*y
	if(z2>0)
	{
		var z=Math.sqrt(1-x*x-y*y)
	}
	else
	{
		x = x/Math.sqrt((Math.pow(x,2)+Math.pow(y,2)));
		y = y/Math.sqrt((Math.pow(x,2)+Math.pow(y,2)))
		z=0;
	}
	// finds the magnitude of the vector (x,y,z)
	var vector = new Array(x,y,z);
//	console.log("initial vector= "+vector);
	// Divide by the magnitude of x,y,z to get a unit vector 
	// pointing in the same direction as x,y,z on trackball
	var normalizedVector = c3dl.normalizeVector(vector);
	return normalizedVector;
//	return vector;
}

// Find the axis of rotation as the cross product of the vectors from origin to initial
// and final position of mouse pointer. Find the angle of rotation by dot product of V1 and V2
function calculateRotationAxisAngle(initialVector, finalVector)
{
	var axis = c3dl.vectorCrossProduct(initialVector,finalVector);
	axis = c3dl.normalizeVector(axis);
//	console.log("axis vector= "+axis);
	// v1 dot v2 = |v1|*|v2|cos(theta)
	// find the angle of rotation: theta = arccos((v1 dot v2)/(|v1|*|v2|))
	var angle=c3dl.getAngleBetweenVectors(initialVector,finalVector);
	angle = c3dl.degreesToRadians(angle);
//	console.log("angle of rotation of axis vector= "+angle);
	return new Array(axis,angle);
}

function orbitCamera(center,vector,angle)
{
	var camPos = cam.getPosition();
	var camQuat = [0,camPos[0],camPos[1],camPos[2]];
	var rotationQuat = c3dl.axisAngleToQuat(vector,-angle);
	// to rotate quaternion v by quaternion q, we do new position = q*v*q^(-1)
	var qv = multiplyQuaternions(rotationQuat,camQuat);
	var qinv = c3dl.inverseQuat(rotationQuat);
	var qvqinv = multiplyQuaternions(qv,qinv);
	console.log("qvqinv= "+qvqinv);
	cam.setPosition(new Array(qvqinv[1],qvqinv[2],qvqinv[3]));
	cam.setLookAtPoint(center);
/*	if(qvqinv[3]<0)
	{
		cam.setUpVector([0,-1,0]);
	}
	else
	{
		cam.setUpVector([0,1,0]);
	}*/
}


//Quaternion multiplication is not commutative. Q1*Q2 != Q2*Q1.
function multiplyQuaternions(q1,q2)
{
// Let Q1 and Q2 be two quaternions, which are defined, respectively, as (w1, x1, y1, z1) and (w2, x2, y2, z2).
	var product = new Array (0,0,0,0);
//      (Q1 * Q2).w =    w1*w2       x1*x2       y1*y2       z1 *z2
	product[0] = (q1[0]*q2[0]-q1[1]*q2[1]-q1[2]*q2[2]-q1[3]*q2[3]);
//      (Q1 * Q2).x =    w1*x2       x1*w2       y1*z2       z1 *y2
	product[1] = (q1[0]*q2[1]+q1[1]*q2[0]+q1[2]*q2[3]-q1[3]*q2[2]);
//      (Q1 * Q2).y =    w1*y2       x1*z2       y1*w2       z1 *x2
	product[2] = (q1[0]*q2[2]-q1[1]*q2[3]+q1[2]*q2[0]+q1[3]*q2[1]);
//      (Q1 * Q2).z =    w1*z2       x1*y2       y1*x2       z1 *w2
	product[3] = (q1[0]*q2[3]+q1[1]*q2[2]-q1[2]*q2[1]+q1[3]*q2[0]);
	return product;
}
