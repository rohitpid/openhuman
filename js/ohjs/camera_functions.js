function storeOriginalCameraView()
{
/*	oH_originalView = new Array(4)
	for(i=0;i<4;i++)
	{
		oH_originalView[i] = new Array(4);
	}
	for(i=0;i<4;i++)
	{
		for(j=0;j<4;j++)
		{
			oH_originalView[i][j] = g_camera.view[i][j];
		}
	}*/
}

function loadOriginalCameraView()
{

	clearRotations();
	showall();
	g_camera = copyCam(def_camera);
	setClientSize();
	updateCamera();
	updateProjection();
	showall();
	
}

function updateCamera()
{
	var up = [0, 1, 0];
	g_viewInfo.drawContext.view = g_math.matrix4.lookAt(g_camera.eye,
	g_camera.target,
	up);
	g_lightPosParam.value = g_camera.eye;
}

function updateProjection()
{
	// Create a perspective projection matrix.
	g_viewInfo.drawContext.projection = g_math.matrix4.perspective(
	g_math.degToRad(45), g_o3dWidth / g_o3dHeight, g_camera.nearPlane,
	g_camera.farPlane);
}

function focusCameraOn(model){
	//Focus the camera on any of the oH_obj
	//The required parameter is a Model object
	
			var bbox = o3djs.util.getBoundingBoxOfTree(model.transform);

			g_camera.target = g_math.lerpVector(bbox.minExtent, bbox.maxExtent, 0.5);

			var diag = g_math.length(g_math.subVector(bbox.maxExtent,bbox.minExtent));

			g_camera.eye = g_math.addVector(g_camera.target, [0, 0, 1.0 * diag]);
			g_camera.nearPlane = diag / 1000;
			g_camera.farPlane = diag * 10;
			setClientSize();
			updateCamera();
			updateProjection();
}

function copyCam(orig){
	
	var copy = new Object();
	copy.eye = orig.eye.slice(0);
	copy.target = orig.target.slice(0);
	copy.nearPlane = orig.nearPlane;
	copy.farPlane = orig.farPlane;
		
	return copy;	
}
