//This is the main openhuman js file

if (!window.console || !window.console.log) window.console= {log: function(){}};

// Global variables
var cam;
var scn;
var pick;
var MMBclicked=false;
var originalXPos;
var originalYPos;
var leftClicked=false;
var mcX;
var mcY;
var canvasStartPosX;
var canvasStartPosY;
var objectSelected=null;
var removedObjects = [];
var currentRotation = new Array(0,0,0);

// speed at which the user moves and turns
const SPEED			= 0.010;
const TURN_SPEED		= 0.002;

// up, down, left, right
var keysPressed = new Array(false,false,false,false,false,false,false,false);

const UP	= 0;
const DOWN	= 1;
const LEFT	= 2;
const RIGHT	= 3;
const INFO	= 4;
const HIDE	= 5;
const CTRL_LEFT	= 6;
const UNHIDE	= 7;

// use wasd instead of arrow keys since arrow keys scrolls the page
const LEFT_ARROW	= 65;	// 65 = A	37 = left arrow
const UP_ARROW		= 87;	// 87 = W	38 = up arrow
const RIGHT_ARROW	= 68;	// 68 = D	39 = right arrow
const DOWN_ARROW	= 83;	// 83 = S	40 = down arrow
const I			= 73;	// 73 = I
const H			= 72;
const CTRL_L		= 17;
const O			= 79;

//Array of objects/textures to be replaced by database later
//var objectDB = new Array(3);
//var objectDB = [ ['face2.dae','face','face.jpg'], ['eye.dae','eye','eye.jpg'], ['skull.dae','cranium',''], ['mandible.dae','mandible',''], ['cerebralcortex.dae','cerebralcortex','brain.jpg'], ['cerebellum.dae','cerebellum',''], ['medulla.dae','medulla',''],['pons.dae','pons',''],['thalamus.dae','thalamus',''],['pituitary.dae','pituitary',''],['hypothalamus.dae','hypothalamus',''],['corpuscallosum.dae','corpuscallosum','']];
var objectDB = [['face.dae','face','face.jpg'],['eye.dae','eye','eye.jpg'], ['skull.dae','cranium',''], ['mandible.dae','mandible',''], ['cerebralcortex.dae','cerebralcortex','brain.jpg']];


c3dl.addMainCallBack(canvasMain, "mainCanvas");

for(i=0;i<objectDB.length;i++)
{
	c3dl.addModel(objectDB[i][0]);
}

// The program main
function canvasMain(canvasName){
    
    // Create new Scene object
    scn = new c3dl.Scene();
    scn.setCanvasTag(canvasName);
    
    // Create GL context
    renderer = new c3dl.OpenGLES20();
    renderer.createRenderer(this);
    scn.setAmbientLight([0,0,0,0]);    
    // Attach renderer to the scene
    scn.setRenderer(renderer);
   // scn.setBackgroundColor([1,1,1,1]);
    //create a pick to accept keyboard and mouse events
//    pick = new c3dl.Picking(scn);

    
    if( scn.init(canvasName) )
    {
        // Create a Collada object that
        // will contain a imported
        // model of some face to put
        // in the scene.
	for (var i=0;i<objectDB.length;i++)
	{
		window[objectDB[i][1]] = new c3dl.Collada();
		//Set Names
		window[objectDB[i][1]].setName(objectDB[i][1]);
		// If the path is already parsed
 		// (as it is in this case)
		// then the model is automatically retrieved
 		// from a collada manager.
		window[objectDB[i][1]].init(objectDB[i][0]);
		// Resize the face.
		window[objectDB[i][1]].scale(new Array(1,1,1));
		// Give the face some texture.
		if(objectDB[i][2] != "")
		{
			window[objectDB[i][1]].setTexture(objectDB[i][2]);
		}
		// Set the position of the face
		window[objectDB[i][1]].translate(new Array(0,0,0));
		// Add the object to the scene
		scn.addObjectToScene(window[objectDB[i][1]]);
	}

        // Create a camera
	cam = new c3dl.FreeCamera();
        
        // Place the camera.
        // Canvas3d uses a right handed co-ordinate system.
        // move ten to the right
        // move 15 up
        // move 5 out
        cam.setPosition(new Array(0.0, 0.0, 10.0));
        
        // Point the camera.
        // Here it is pointed at the same location as
        // the face so the face will appear centered.
        cam.setLookAtPoint(new Array(0.0, 0.0, 0.0));
        
        // Add the camera to the scene
        scn.setCamera(cam);
        
        // Start the scene
        scn.startScene();

	//// 1 light with only ambient light
//	var ambient = new c3dl.PositionalLight();
//	ambient.setName('ambient');
//	ambient.setPosition([0,-200,200]);
//	ambient.setAmbient([1,1,1,1]);
//	ambient.setOn(true);
//	scn.addLight(ambient);
//	scn.setAmbientLight([0,0,0,1]);

	// 2 positional light with diffuse
	var diffuse = new c3dl.PositionalLight();
	diffuse.setName('diffuse');
	diffuse.setPosition([0,0,16]);
	diffuse.setDiffuse([1,1,1,1]);
	diffuse.setOn(true);
	scn.addLight(diffuse);

	// 3 positional light with diffuse
	var diffuse = new c3dl.PositionalLight();
	diffuse.setName('diffuse');
	diffuse.setPosition([0,7,1]);
	diffuse.setDiffuse([0.5,0.5,0.5,1]);
	diffuse.setOn(true);
	scn.addLight(diffuse);

	// 4 purple directional light
	var directional = new c3dl.DirectionalLight();
	directional.setName('directional');
	directional.setDirection([0,0,1]);
	directional.setDiffuse([0.7,0.7,0.7,1]);
	directional.setOn(true);
	scn.addLight(directional);

	// 5 specular light
	// this is an expiremental feature
	// to enable it uncomment lines 502-504 in scene.js
	// (the lines calling glCanvas3D.lightModel and 
	//  glCanvas3D.material)
/*	var specular = new c3dl.PositionalLight();
	specular.setName('specular');
	specular.setPosition([0,-1,200]);
//	specular.setSpecular([1,1,1,1]);
	specular.setDiffuse([0.6,0.6,0.6,1]);
	specular.setOn(true);
	scn.addLight(specular);*/

	scn.setKeyboardCallback(onKeyUp, onKeyDown);
	scn.setPickingCallback(onPick);
	scn.setMouseCallback(mouseUp, mouseDown, mouseMove, scroll);
	scn.setUpdateCallback(update);
	// tell the scene what function to use when
	// a mouse event is detected
    }
}

function update()
{
	if(keysPressed[UP])
	{
		zoomIn();
	}
	
	if(keysPressed[DOWN])
	{
		zoomOut();
	}
	
	
	if( keysPressed[DOWN] == false && keysPressed[UP] == false)
	{
		cam.setLinearVel(new Array(0,0,0));
	}
	
	if( keysPressed[RIGHT])
	{
		cam.setAngularVel(new Array(0,-TURN_SPEED,0));
	}
	
	if( keysPressed[LEFT])
	{
		cam.setAngularVel(new Array(0,TURN_SPEED,0));
	}
	
	if( keysPressed[LEFT] == false && keysPressed[RIGHT] == false)
	{
		cam.setAngularVel(new Array(0,0,0));
	}

	if( keysPressed[UNHIDE] && removedObjects.length != 0)
	{
		for(i=0;i<removedObjects.length;i++)
		{
//			console.log("objects added back: "+removedObjects[i].getName());
			scn.addObjectToScene(removedObjects.pop());
		}
	}
	document.getElementById('debug').innerHTML = scn.getFPS();
}
function changeKeyState(event, keyState)
{
	switch( event.keyCode)
	{
		case UP_ARROW: keysPressed[0] = keyState;break;
		case DOWN_ARROW: keysPressed[1] = keyState;break;
		case LEFT_ARROW: keysPressed[2] = keyState;break;
		case RIGHT_ARROW: keysPressed[3] = keyState;break;
		case I:  keysPressed[4] = keyState;break;
		case H:	 keysPressed[5] = keyState;break;
		case CTRL_L: keysPressed[6] = keyState;break;
		case O:  keysPressed[7] = keyState;break;	
	}
}

/**
*/
function onKeyUp(event)
{
	// the key has been released
	changeKeyState(event, false);
}

/**
*/
function onKeyDown(event)
{
	// key has been pressed
	changeKeyState(event, true);
}


function scroll(event)
{
	delta=-event.detail/3;
	if(delta>0)
	{
		zoomIn();
	}
	if(delta<0)
	{
		zoomOut();
	}
}

function mouseUp(event)
{
	if(event.button==1)
	{
		MMBclicked=false;
		
	}
	if(event.button==0)
	{
		leftClicked=false;
	}
}

function mouseDown(event)
{
	if(event.button==1)
	{
		MMBclicked=true;
		mcX=event.clientX;
		mcY=event.clientY;
	}
	if(event.button==0)
	{
	var canvasElement=document.getElementById("mainCanvas");
	// findPos is in trackball.js
	canvasStartPosX= findPos(canvasElement)[0];
	canvasStartPosY= findPos(canvasElement)[1];
	leftClicked=true;
	//find the starting coordinate of the canvas in X and Y
	originalXPos=event.clientX-canvasStartPosX;
	originalYPos=event.clientY-canvasStartPosY;
	}
}

function mouseMove(event)
{
	if(MMBclicked==true)
	{
		deltaX=event.clientX - mcX;
		deltaY=event.clientY - mcY;
		translate(deltaX,deltaY);	
	}
	if(leftClicked==true)
	{
	mouseMoveFreeRotate(event);
	}
}

function onPick(pickingResult)
{	
	var objectsHit = pickingResult.getObjects();

	if(pickingResult.getButtonUsed()==3 && objectsHit.length > 0)
	{
		objectSelected = objectsHit[0];
		document.getElementById('tb_selected').innerHTML="Object Selected: ";
		document.getElementById('tb_selected').innerHTML+=objectSelected.getName();
	}
	else  if(pickingResult.getButtonUsed()==3 && objectsHit.length == 0)
	{
		objectSelected=null;
		document.getElementById('tb_selected').innerHTML="Object Selected: ";
	}
}

function info(obj)
{
	if(obj != null)
	{
//		$("#dialog2").attr("src","http://en.wikipedia.org/wiki/"+bodyParts[objectsPicked[i]]);
		$("#dialog2")[0].src="http://en.wikipedia.org/wiki/"+obj.getName();
		$("#dialog2").dialog("open");
	}
}

function hide(obj)
{
	if(obj != null && removedObjects.indexOf(obj) == -1)
	{
		scn.removeObjectFromScene(obj);
		removedObjects.push(obj);
	}
}

function show(obj)
{
	if(removedObjects.length > 0)
	{
		for(i=0;i<removedObjects.length;i++)
		console.log("removed Object list before adding:"+removedObjects[i].getName());
		scn.addObjectToScene(removedObjects.pop());
//		setRotations(obj);
	}
}

function hideall()
{
	//since after each iteration scn.getObjListSize(); is one less, we use this strange
	//loop structure as incrementing i is not necessary.
	for (i = 0; i < scn.getObjListSize();) 
	{
		obj=scn.getObj(0);
		console.log("iterations "+i);
		scn.removeObjectFromScene(obj);
		console.log("removed object is "+obj.getName());
		removedObjects.push(obj);
	}
}

function showall()
{
	if(removedObjects.length != 0)
	{
		var removedObjects_size = removedObjects.length;
		for(i=0;i<removedObjects_size;i++)
		{
			obj=removedObjects.pop();
			scn.addObjectToScene(obj);
//			setRotations(obj);
			console.log("added object "+obj.getName());
		}
	}
}

function zoomIn()
{
	var direction = new Array(cam.getDir()[0], cam.getDir()[1], cam.getDir()[2]);
	c3dl.normalizeVector(direction);		
	c3dl.multiplyVector(direction, SPEED, direction);		
	cam.setLinearVel(direction);
}

function zoomOut()
{
	var direction = new Array(-cam.getDir()[0], -cam.getDir()[1], -cam.getDir()[2]);
	c3dl.normalizeVector(direction);		
	c3dl.multiplyVector(direction, SPEED, direction);		
	cam.setLinearVel(direction);
}

// rotation by the 4 way rotation control for X and Y axes
// rotation in Z axis controlled by rotateZ function below
function rotate(direction)
{
	var testObj;
	if(direction==UP)
	{
/*		for (var i = 0; i < scn.getObjListSize(); i++) 
		{
			testObj = scn.getObj(i);
//			Pitch is rotation in Z,Y plane
			testObj.pitch((Math.PI/18));
			currentRotation[0] +=(Math.PI/18);
		}*/
		orbitCamera([0,0,0],[1,0,0],-(Math.PI/18));
	}
	if(direction==DOWN)
	{
	/*	for (var i = 0; i < scn.getObjListSize(); i++) 
		{
			testObj = scn.getObj(i);
//			Pitch is rotation in Z,Y plane
			testObj.pitch((-Math.PI/18));
			currentRotation[0] -=(Math.PI/18);
		} */
		orbitCamera([0,0,0],[1,0,0],(Math.PI/18));
	}
	if(direction==LEFT)
	{
	/*	for (var i = 0; i < scn.getObjListSize(); i++) 
		{
			testObj = scn.getObj(i);
//			roll is rotation in X,Y
			testObj.roll((-Math.PI/18));
			currentRotation[2] -=(Math.PI/18);
		}*/
		orbitCamera([0,0,0],cam.getUp(),(-Math.PI/18));
	}
	if(direction==RIGHT)
	{
	/*	for (var i = 0; i < scn.getObjListSize(); i++) 
		{
			testObj = scn.getObj(i);
			testObj.roll((Math.PI/18));
			currentRotation[2] +=(Math.PI/18);
		}*/
		orbitCamera([0,0,0],cam.getUp(),(Math.PI/18));
	}
}
//Rotation by the circular knob on outside of rotation control
function rotateZ(angle)
{
	cam.roll(-angle);
}

function translate(deltaX,deltaY)
{
	var testObj;
	for (var i=0; i <scn.getObjListSize(); i++)
	{
		testObj = scn.getObj(i);
		testObj.translate(new Array(deltaX/2000,0,deltaY/2000));
	}
}

function translateButtons(direction)
{
	var testObj;
	if(direction==UP)
	{
		for (var i=0; i <scn.getObjListSize(); i++)
		{
			testObj = scn.getObj(i);
			testObj.translate(new Array(0,0,-1));
		}
	}
	if(direction==DOWN)
	{
		for (var i=0; i <scn.getObjListSize(); i++)
		{
			testObj = scn.getObj(i);
			testObj.translate(new Array(0,0,1));
		}
	}
	if(direction==LEFT)
	{
		for (var i=0; i <scn.getObjListSize(); i++)
		{
			testObj = scn.getObj(i);
			testObj.translate(new Array(1,0,0));
			
		}
	}
	if(direction==RIGHT)
	{
		for (var i=0; i <scn.getObjListSize(); i++)
		{
			testObj = scn.getObj(i);
			testObj.translate(new Array(-1,0,0));
		}
	}
}

function scale(scaleValue)
{
	var testObj;
	console.log("value passed to scaler "+scaleValue);
	for (var i = 0; i < scn.getObjListSize(); i++) 
	{
		testObj = scn.getObj(i);
		testObj.scale(new Array(scaleValue,scaleValue,scaleValue))
	}
}
/*
window.onload=function(){
if(!NiftyCheck())
    return;
Rounded("div#tb_selected","#377CB1","#9BD1FA"); 
} */
