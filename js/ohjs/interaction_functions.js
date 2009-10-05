/*
 * Copyright 2009 Rohit Pidaparthi
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Author: Rohit Pidaparthi <rohitpid@gmail.com>
 *
 */

function pan(x,y,z)
{
	var factor = 0.5;

	var trans_dir = g_math.normalize(g_math.cross(g_camera.eye, [0,1,0] ) );
	trans_dir = g_math.mulVectorScalar(trans_dir,factor*-x);
	
	g_viewInfo.drawContext.projection = g_math.matrix4.translate(g_viewInfo.drawContext.projection,trans_dir);
	
	var trans_dir = g_math.normalize(g_math.cross(g_camera.eye, [1,0,0] ) );
	trans_dir = g_math.mulVectorScalar(trans_dir,factor*y);
	g_viewInfo.drawContext.projection = g_math.matrix4.translate(g_viewInfo.drawContext.projection,trans_dir);
}

function scale(scaleValue)
{	

	for(i=0;i<oH_obj.length;i++)
	oH_obj[i].transform.scale(scaleValue,scaleValue,scaleValue);
}

function zoomScroller(t)
{
	g_camera.eye = g_math.lerpVector(g_camera.target, g_camera.eye, t);
	updateCamera();
}

function scrollMe(e)
{
	if (e.deltaY)
	{
		var t = 1;
		if (e.deltaY > 0)
		t = 11/12;
	else
		t = 13/12;
	g_camera.eye = g_math.lerpVector(g_camera.target, g_camera.eye, t);
	updateCamera();
	}
}

function buttonRotate(e)
{	
	switch(e.charCode)
	{
		case 119:	//W Key
		buttonRotation(20,0);
		break;
		
		case 115:	//S Key
		buttonRotation(-20,0);
		break;
		
		case 97:	//A Key
		buttonRotation(-20,1);
		break;
		
		case 100:	//D  Key
		buttonRotation(20,1);
		break;
		
		case 106:
		oH_obj[0].transform.translate(5,0,0);
		break;
		
		case 108:
		oH_obj[0].transform.translate(5,0,0);
		break;
		
		case 105:
		oH_obj[0].transform.translate(5,0,0);
		break;
		
		case 107:
		oH_obj[0].transform.translate(5,0,0);
		break;
		
		
		default:
		break;
	}
}

function buttonRotation(angle,axis)
{
	var rotationQuat;
	var rot_mat;	
	g_lastRot = g_thisRot;
	if (axis == 0) {

		for(i=0;i<oH_obj.length;i++)
		oH_obj[i].transform.quaternionRotate(g_quaternions.rotationX(-angle));

		rotationQuat = g_quaternions.rotationX(-angle);
	}
	else if (axis == 1) {

		for(i=0;i<oH_obj.length;i++)
		oH_obj[i].transform.quaternionRotate(g_quaternions.rotationY(angle));

		rotationQuat = g_quaternions.rotationY(angle);
	}
	else {

		for(i=0;i<oH_obj.length;i++)
		oH_obj[i].transform.quaternionRotate(g_quaternions.rotationZ(angle));

		rotationQuat = g_quaternions.rotationZ(angle);
	}
	rot_mat = g_quaternions.quaternionToRotation(rotationQuat);
	g_thisRot = g_math.matrix4.mul(g_lastRot, rot_mat);
}


/******************************************************************************/

function resetView()
{
	/*
	var bbox = o3djs.util.getBoundingBoxOfTree(g_client.root);

	g_camera.target = g_math.lerpVector(bbox.minExtent, bbox.maxExtent, 0.5);

	var diag = g_math.length(g_math.subVector(bbox.maxExtent,bbox.minExtent));

	g_camera.eye = g_math.addVector(g_camera.target, [0, 0, 1 * diag]);
	g_camera.nearPlane = diag / 1000;
	g_camera.farPlane = diag * 10;
	*/
	
	g_camera = copyCam(def_camera);
	setClientSize();
	updateCamera();
	updateProjection();
	showall();
}

function hide(model)
{
	/* 
	 * This function accepts an optional model argument which it hides if it is passed.
	*/	
	if (model) 
	{
			if (model.visible) {
				//model.transform.translate(100, 100, 100);
				model.transform.visible = false;
				updateInfo();
				model.visible = false;
			}
	}
	else {
		// Add it to the same transform
		if (g_selectedInfo) {
			//For some reason g_selectedInfo.shapeInfo.parent.transform does not refer to the transform holding mesh
			//Yet it translates the mesh. TODO: Need to figure out where in the hierarchy this transform occurs
			for (var i = 0; i < oH_numObj; i++) {
				//medulla oblongata is mispelled in the blend file so the object name is wrong and it can never be hidden. Need to set names from XML.
				//console.log("Pick "+g_selectedInfo.shapeInfo.parent.transform.name.toLowerCase()+" Obj "+oH_obj[i].transform.name.replace(/ /,""));
				if (g_selectedInfo.shapeInfo.parent.transform.name.toLowerCase() == oH_obj[i].transform.name.replace(/ /, "")) {
					occludeModel(oH_obj[i]);
					g_loadingElement.innerHTML = oH_obj[i].transform.name + " hidden";					
					removedObjects.push(oH_obj[i].transform);					
				}
			}			
		}		
		//Remove the rayinfo after the hide so that it doesnt muck up things later
		g_selectedInfo = null;
	}
}

function show(model)
{
	/* 
	 * This function (like hide) accepts an optional model argument which it hides if it is passed.
	 */
	if (model) {
			
			if (!model.visible) {
				//model.transform.translate(-100, -100, -100);
				model.transform.visible = true;
				updateInfo();
				model.visible = true;
			}
	
	}
	else {
		if (removedObjects.length > 0) {
			var obj = removedObjects.pop();
			revealModel(getParentModel(obj));
			g_loadingElement.innerHTML = obj.name + " shown";
		}
	}
}

function hideall()
{
	//We have to move all objects back to default state so that
	//we don't end up with objects moved to (200,200,200) if 
	//they have already been hidden once so do showall() first.
	showall();

	for (var i = 0; i<oH_obj.length;i++)
	{
		if (oH_obj[i].visible) {
			occludeModel(oH_obj[i]);
			removedObjects.push(oH_obj[i].transform);
		}
	}
	g_loadingElement.innerHTML = "All objects hidden";
}

function showall()
{
	if(removedObjects.length != 0)
	{
		for(i=0;removedObjects.length !=0;)
		{
			var obj=getParentModel(removedObjects.pop());		
		}		
		g_loadingElement.innerHTML = "All objects shown";
	}
	
	//We want to reveal only the models that are outermost
	// i.e. not inside any other
	for (var i = 0; i<oH_obj.length;i++)
	{		
		if (oH_obj[i].insideOf=='none') {
			revealModel(oH_obj[i]);
		}
	}
	
}
