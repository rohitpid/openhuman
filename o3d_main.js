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

o3djs.require('o3djs.util');
o3djs.require('o3djs.math');
o3djs.require('o3djs.quaternions');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.pack');
o3djs.require('o3djs.arcball');
o3djs.require('o3djs.scene');
o3djs.require('o3djs.picking');
o3djs.require('o3djs.primitives');
o3djs.require('o3djs.effect');
o3djs.require('o3djs.loader');
o3djs.require('o3djs.canvas');
o3djs.require('o3djs.camera');
o3djs.require('o3djs.debug');

// global o3d variables
var g_root = [];
var g_o3d;
var g_math;
var g_quaternions;
var g_client;
var g_aball;
var g_thisRot;
var g_lastRot;
var g_pack = null;
var g_mainPack;
var g_viewInfo;
var g_lightPosParam;
var g_loadingElement;
var g_o3dWidth = -1;
var g_o3dHeight = -1;
var g_o3dElement;
var g_finished = false;	// for selenium
var g_treeInfo;		// information about the transform graph.
var g_hud_treeInfo; // information about the transformation graph for the HUD
var g_camera = {
  farPlane: 5000,
  nearPlane:0.1
};
var def_camera;
var g_dragging = false;

//global oH variables
var oH_obj;
var oH_numObj;
var oH_OBJECTS_LIST;
var oH_ASSET_PATH;
var oH_originalView;

var removedObjects = [];
var g_hudRoot;
var g_hudViewInfo;
var g_materialUrls = [
  'shaders/texture-colormult.shader',     // 0
  'shaders/phong-with-colormult.shader'  // 1    
];
var g_textureUrls = [
  'openhumanlogo.png',      // 0
  'circularbutton6.png',	// 1
  'circularbutton7.png',	// 2
  ]
var g_materials =[];	//To store manually loaded materials, used for HUD etc.
var g_textures  =[];	//To store manually loaded textures

var flashing;
var flashTimer = 0;
var flashShape;

var flashDURATION = 1000;
var flashINTERVAL = 500;
var flashCounter  = 0;

var flashMode = -1;
var flashOrigColor;
var flashedThisInterval;

var g_highlightShape;
var origMaterial;

var flashType	= "COLOR";	//Change this to "MESH" if you want mesh highlighting
							//"COLOR" for color highlighting
var highlightMeshTransform;
var objectRoot;
var hudCanvasLib;			//Canvas library for the HUD 

var someText;
var someLabel;

var g_debugHelper;
var g_debugLineGroup;
var g_debugLine;
var NORMAL_SCALE_FACTOR = 1.0;

var labelArrowTransform;
var labelArrowShape;
var labelArrowMaterial;
var currlabelPos;
var currLabelText;
var labelVisible = false;
var xmlDoc;

var labelDebug = false;
var fakeTestModel;
var oH_Logo;
var billboardMaterial;
var g_globalParams;
var tempTex;

var oH_obj_named_array = [];

var LABEL_SIZE_FACTOR = 1;

/**
 * Creates the client area.
 */
function init()
{
	o3djs.util.makeClients(initStep2,"LargeGeometry");
}

/**
 * Initializes O3D and loads the scene into the transform graph.
 * @param {Array} clientElements Array of o3d object elements.
 */
function initStep2(clientElements){
	//Load the XML file database.xml to xmlDoc
	//so that we can parse data for models and labels later
	if (window.XMLHttpRequest) {
		AJAXRequest = new window.XMLHttpRequest();
		AJAXRequest.open("GET", "database.xml", false);
		AJAXRequest.send("");
		xmlDoc = AJAXRequest.responseXML;
	}
	
	g_loadingElement = document.getElementById('info_text');
	
	g_o3dElement = clientElements[0];
	g_o3d = g_o3dElement.o3d;
	g_math = o3djs.math;
	g_quaternions = o3djs.quaternions;
	g_client = g_o3dElement.client;
	
	g_mainPack = g_client.createPack();
	
	
	// Create the render graph for a view.
	g_viewInfo = o3djs.rendergraph.createBasicView(g_mainPack, g_client.root, g_client.renderGraphRoot);
	
	//Add a debug line to use for testing 
	g_debugHelper = o3djs.debug.createDebugHelper(g_client.createPack(), g_viewInfo);
	g_debugLineGroup = g_debugHelper.createDebugLineGroup(g_client.root);
	g_debugLine = g_debugLineGroup.addLine();
	g_debugLine.setColor([0, 1, 0, 1]);
	
	g_lastRot = g_math.matrix4.identity();
	g_thisRot = g_math.matrix4.identity();
	
	var root = g_client.root;
	
	g_aball = o3djs.arcball.create(100, 100);
	setClientSize();
	
	// Set the light at the same position as the camera to create a headlight
	// that illuminates the object straight on.
	var paramObject = g_mainPack.createObject('ParamObject');
	g_lightPosParam = paramObject.createParam('lightWorldPos', 'ParamFloat3');
	g_camera.target = [0, 0, 0];
	g_camera.eye = [0, 0, 5];
	updateCamera();
	
	o3djs.event.addEventListener(g_o3dElement, 'mousedown', startDragging);
	o3djs.event.addEventListener(g_o3dElement, 'mousemove', drag);
	o3djs.event.addEventListener(g_o3dElement, 'mouseup', stopDragging);
	o3djs.event.addEventListener(g_o3dElement, 'wheel', scrollMe);
	o3djs.event.addEventListener(g_o3dElement, 'keypress', buttonRotate);
	
	g_client.setRenderCallback(onRender);
	flashing = false;
	flashOrigColor = null;
	flashObject = null;
	
	//Create the main pack (NOTE: This was previously done inside loadFile()	
	g_pack = g_client.createPack();
	
	// Create a material for highlighting.
	g_highlightMaterial = g_pack.createObject('Material');
	g_highlightMaterial.drawList = g_viewInfo.performanceDrawList;
	
	var effect = g_pack.createObject('Effect');
	o3djs.effect.loadEffect(effect, 'shaders/solid-color.shader');
	g_highlightMaterial.effect = effect;
	
	effect.createUniformParameters(g_highlightMaterial);
	
	// Setup a state to bring the lines forward.
	var state = g_pack.createObject('State');
	state.getStateParam('PolygonOffset2').value = -1.0;
	state.getStateParam('FillMode').value = g_o3d.State.WIREFRAME;
	g_highlightMaterial.state = state;
	origMaterial = new Array();
	g_highlightShape = null;
	
	/*************HUD IMPLEMENTATION**************************/
	
	//Create root transform for HUD
	g_hudRoot = g_pack.createObject('Transform');
	
	// Create a second view for the hud. 
	g_hudViewInfo = o3djs.rendergraph.createBasicView(g_pack, g_hudRoot, g_client.renderGraphRoot);
	
	// Make sure the hud gets drawn after the 3d stuff
	g_hudViewInfo.root.priority = g_viewInfo.root.priority + 1;
	
	// Turn off clearing the color for the hud since that would erase the 3d
	// parts but leave clearing the depth and stencil so the HUD is unaffected
	// by anything done by the 3d parts.
	g_hudViewInfo.clearBuffer.clearColorFlag = false;
	
	// Set culling to none so we can flip images using rotation or negative scale.
	g_hudViewInfo.zOrderedState.getStateParam('CullMode').value = g_o3d.State.CULL_NONE;
	g_hudViewInfo.zOrderedState.getStateParam('ZWriteEnable').value = false;
	
	// Create an orthographic matrix for 2d stuff in the HUD.
	// We assume the area is 800 pixels by 600 pixels and therefore we can
	// position things using a 0-799, 0-599 coordinate system. If we change the
	// size of the client area everything will get scaled to fix but we don't
	// have to change any of our code. See 2d.html
	
	g_hudViewInfo.drawContext.projection = g_math.matrix4.orthographic(0 + 0.5, g_client.width + 0.5, g_client.height + 0.5, 0 + 0.5, 0.001, 1000);
	
	g_hudViewInfo.drawContext.view = g_math.matrix4.lookAt([0, 0, 1], // eye
 [0, 0, 0], // target
 [0, 1, 0]); // up
	//Setup the materials for the HUD. Unlike the models this must be done manually
	//For now we have just one material. We may later have to add more.
	for (var ii = 0; ii < g_materialUrls.length; ++ii) {
		var effect = g_pack.createObject('Effect');
		o3djs.effect.loadEffect(effect, g_materialUrls[ii]);
		
		// Create a Material for the effect.
		var material = g_pack.createObject('Material');
		
		// Apply our effect to this material.
		material.effect = effect;
		
		// Create the params the effect needs on the material.
		effect.createUniformParameters(material);
		
		// Set the default params. We'll override these with params on transforms.
		material.getParam('colorMult').value = [1, 1, 1, 1];
		
		g_materials[ii] = material;
	}
	// g_materials[0].drawList = g_hudViewInfo.zOrderedDrawList;
	g_materials[0].drawList = g_viewInfo.zOrderedDrawList;
	
	// Create an instance of the canvas utilities library.
	hudCanvasLib = o3djs.canvas.create(g_pack, g_hudRoot, g_hudViewInfo);
	
	var labelArrowEffect = g_pack.createObject('Effect');
	o3djs.effect.loadEffect(labelArrowEffect, 'shaders/solid-color.shader');
	
	labelArrowMaterial = g_pack.createObject('Material');
	labelArrowMaterial.effect = labelArrowEffect;
	
	labelArrowEffect.createUniformParameters(labelArrowMaterial);
	labelArrowMaterial.drawList = g_viewInfo.performanceDrawList;
	
	//Set arrow material to black
	labelArrowMaterial.getParam('color').value = [0, 0, 0, 1];
	
	// Load all the labelText textures.
	var loader = o3djs.loader.createLoader(initStep3);
	
	for (var ii = 0; ii < xmlDoc.getElementsByTagName("model_name").length; ++ii) {
	
		for (j = 0; j < xmlDoc.getElementsByTagName("model")[ii].getElementsByTagName("label").length; j++) {
			loadTexture(loader, "assets/bitmaps/" + xmlDoc.getElementsByTagName("model")[ii].getElementsByTagName("label")[j].getElementsByTagName("label_bitmap")[0].childNodes[0].nodeValue);
												
		}
		loader.finish();
		
	}
	
}

function initStep3(){

	/*
	//REMOVE THIS IF WE CAN DO AWAY WITH THE LOADER CODE
	oH_Logo = new LabelImage(g_textures[0], true,g_client.root,"logo");
	*/
	
	//Now that everything is setup, load all the models
	loadModels();
	
	//Create a material for the plane on which to put the label bitmaps
	//NOTE: This material uses the billboard shader from the billboards example at o3d
	billboardMaterial = o3djs.material.createMaterialFromFile( g_pack, 
															   'shaders/billboard.shader', 
															   g_viewInfo.zOrderedDrawList
															  );
	
	//Then all the labels
	loadLabels();
	
	updateHUDInfo();
		
	setupVisibilityTree();
	
	//We hideall and showall for the occlusion code to hide all internal models
	hideall();
	showall();
	
	//We pause the script to let the models finish loading.
	//This is because even though the model loader says loading is done, the models still keep loading
	//We also store the default position of the camera	
	setTimeout("{	zoomScroller(0.05);	def_camera = copyCam(g_camera);	}",5000);
	
}	

function loadModels(reload)
{
	oH_OBJECTS_LIST = [];
	oH_OBJECTS_NAMES = [];
	oH_numObj =0;
	oH_ASSET_PATH = "assets/oH/";
	
	for(i=0;i<xmlDoc.getElementsByTagName("asset").length;i++)
	{
		oH_OBJECTS_LIST[i]= xmlDoc.getElementsByTagName("asset")[i].childNodes[0].nodeValue;
		oH_OBJECTS_NAMES[i]=xmlDoc.getElementsByTagName("model_name")[i].childNodes[0].nodeValue;
		 
	}
	
	/*oH_OBJECTS_LIST = new Array  (
		"head.o3dtgz",
		"eye.o3dtgz",
		"skull.o3dtgz",
		"mandible.o3dtgz",
		"cerebralcortex.o3dtgz",
		"corpuscallosum.o3dtgz",
		"thalamus.o3dtgz",
		"cerebellum.o3dtgz",
		"medulla_oblongata.o3dtgz",
		"pituitary.o3dtgz",
		"pons.o3dtgz",
		"hypothalamus.o3dtgz"
		/*"cube.o3dtgz"
	);*/

	//use the reload boolean in case a reload is necessary
	
	if (reload) {
		if (g_pack) {
			g_pack.destroy();
			g_pack = null;
			oH_obj = null;
		}
	}
	
	oH_numObj = 0;
	oH_obj = new Array();
	
	for (i = 0; i < oH_OBJECTS_LIST.length; i++) 
	{	
		oH_obj[oH_numObj] = new Model( loadFile( g_viewInfo.drawContext, oH_ASSET_PATH + oH_OBJECTS_LIST[i] ) );
		oH_obj[oH_numObj].transform.name = oH_OBJECTS_NAMES[i];		
		
		//Also store the objects in a named array for easier lookup by name later using getModelByName() function
		oH_obj_named_array[oH_obj[oH_numObj].transform.name] = oH_obj[oH_numObj];
		
		oH_numObj++;
		
	}
	g_root=oH_obj;
}

function loadLabels()
{
	//console.log("entering load labels");
	//console.log(xmlDoc.getElementsByTagName("model")[0].getElementsByTagName("label")[0].getElementsByTagName("label_bitmap")[0].childNodes[0].nodeValue);
	for(i=0;i<xmlDoc.getElementsByTagName("model_name").length;i++)
	{
		
		oH_obj[i].insideOf = xmlDoc.getElementsByTagName("insideof")[i].childNodes[0].nodeValue;
		oH_obj[i].drawWith = xmlDoc.getElementsByTagName("draw_with")[i].childNodes[0].nodeValue;
		
		//alert(oH_obj[i].transform.name +" is InsideOf " + oH_obj[i].insideOf + " drawn with " + oH_obj[i].drawWith);
		
		//console.log("entering first for");
		//console.log(xmlDoc.getElementsByTagName("model_name")[i].getElementsByTagName("label")[0].childNodes[0].nodeValue);
		for(j=0;j<xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label").length;j++)
		{
			//console.log("entering second for loop");
			//console.log(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("label_bitmap")[0].childNodes[0].nodeValue);
			
			oH_obj[i].addLabel(
			xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("label_name")[0].childNodes[0].nodeValue,
			xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("label_bitmap")[0].childNodes[0].nodeValue,
			[new Number(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("position")[0].getElementsByTagName("x")[0].childNodes[0].nodeValue).valueOf(),
			new Number(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("position")[0].getElementsByTagName("y")[0].childNodes[0].nodeValue).valueOf(),
			new Number(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("position")[0].getElementsByTagName("z")[0].childNodes[0].nodeValue).valueOf()],
			[new Number(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("position")[0].getElementsByTagName("normal_x")[0].childNodes[0].nodeValue).valueOf(),
			new Number(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("position")[0].getElementsByTagName("normal_y")[0].childNodes[0].nodeValue).valueOf(),
			new Number(xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("position")[0].getElementsByTagName("normal_z")[0].childNodes[0].nodeValue).valueOf()],
			xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("summary")[0].childNodes[0].nodeValue,
			xmlDoc.getElementsByTagName("model")[i].getElementsByTagName("label")[j].getElementsByTagName("link")[0].childNodes[0].nodeValue
			);
		}
	}
}

function removeLabels()
{
	for(i=0;i<oH_obj.length;i++)
	{
		for(j=0;j<oH_obj[i].labels.length;j++)
		{
			oH_obj[i].labels[j].hideArrow();
		}
		
	}
}

function loadFile(context, path)
{
	function callback(pack, parent, exception)
	{
		//enableInput(true);
		if (exception)
		{
			alert("Could not load: " + path + "\n" + exception);
			g_loadingElement.innerHTML = "loading failed.";
		}
		else
		{
			g_loadingElement.innerHTML = "loading finished.";

			// Generate draw elements and setup material draw lists.
			o3djs.pack.preparePack(pack, g_viewInfo);

			var bbox = o3djs.util.getBoundingBoxOfTree(g_client.root);

			g_camera.target = g_math.lerpVector(bbox.minExtent, bbox.maxExtent, 0.5);

			var diag = g_math.length(g_math.subVector(bbox.maxExtent,bbox.minExtent));

			g_camera.eye = g_math.addVector(g_camera.target, [0, 0, 1.0 * diag]);
			g_camera.nearPlane = diag / 1000;
			g_camera.farPlane = diag * 10;
			setClientSize();
			updateCamera();
			updateProjection();

			// Manually connect all the materials' lightWorldPos params to the context
			var materials = pack.getObjectsByClassName('o3d.Material');
			for (var m = 0; m < materials.length; ++m)
			{
				var material = materials[m];
				var param = material.getParam('lightWorldPos');
				if (param)
				{
					param.bind(g_lightPosParam);
				}
				
				
				var effect = material.effect;  				
  				effect.createUniformParameters(material);
				
				
			}

			g_finished = true;  // for selenium

			// Comment out the next line to dump lots of info.
			if (false)
			{
				o3djs.dump.dump('---dumping context---\n');
				o3djs.dump.dumpParamObject(context);

				o3djs.dump.dump('---dumping root---\n');
				o3djs.dump.dumpTransformTree(g_client.root);

				o3djs.dump.dump('---dumping render root---\n');
				o3djs.dump.dumpRenderNodeTree(g_client.renderGraphRoot);

				o3djs.dump.dump('---dump g_pack shapes---\n');
				var shapes = pack.getObjectsByClassName('o3d.Shape');
				for (var t = 0; t < shapes.length; t++) 
				{
					o3djs.dump.dumpShape(shapes[t]);
				}

				o3djs.dump.dump('---dump g_pack materials---\n');
				var materials = pack.getObjectsByClassName('o3d.Material');
				for (var t = 0; t < materials.length; t++)
				{
					o3djs.dump.dump ('  ' + t + ' : ' + materials[t].className +
					' : "' + materials[t].name + '"\n');
					o3djs.dump.dumpParams(materials[t], '    ');
				}

				o3djs.dump.dump('---dump g_pack textures---\n');
				var textures = pack.getObjectsByClassName('o3d.Texture');
				for (var t = 0; t < textures.length; t++)
				{
					o3djs.dump.dumpTexture(textures[t]);
				}

				o3djs.dump.dump('---dump g_pack effects---\n');
				var effects = pack.getObjectsByClassName('o3d.Effect');
				for (var t = 0; t < effects.length; t++)
				{
					o3djs.dump.dump('  ' + t + ' : ' + effects[t].className +
					' : "' + effects[t].name + '"\n');
					o3djs.dump.dumpParams(effects[t], '    ');
				}
			}
		}
	}

	// Create a new transform for the loaded file
	var mesh = g_pack.createObject('Transform');
	mesh.parent = g_client.root;
	if (path != null)
	{
		g_loadingElement.innerHTML = "Loading: " + path;
		//enableInput(false);
		try
		{
			o3djs.scene.loadScene(g_client, g_pack, mesh, path, callback);
		}
		catch(e)
		{
			//enableInput(true);
			g_loadingElement.innerHTML = "loading failed : " + e;
		}
	}
	
	updateInfo();

	return mesh;
	
}

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

function updateInfo()
{
	if (!g_treeInfo) 
	{
		g_treeInfo = o3djs.picking.createTransformInfo(g_client.root,null);
	}
	g_treeInfo.update();
}

function updateHUDInfo()
{
	if (!g_hud_treeInfo) 
	{
		g_hud_treeInfo = o3djs.picking.createTransformInfo(g_hudRoot,null);
	}
	
}



function startDragging(e)
{
	g_lastRot = g_thisRot;
	g_aball.click([e.x, e.y]);
	g_dragging = true;
//	if(e.shiftKey)
	pick(e);
}

function drag(e)
{
	if (g_dragging)
	{
		var rotationQuat = g_aball.drag([e.x, e.y]);
		var rot_mat = g_quaternions.quaternionToRotation(rotationQuat);
		g_thisRot = g_math.matrix4.mul(g_lastRot, rot_mat);

			

		for(i=0;i<oH_obj.length;i++)
		{
			var meshRot = oH_obj[i].transform.localMatrix;
			g_math.matrix4.setUpper3x3(meshRot, g_thisRot);
			oH_obj[i].transform.localMatrix = meshRot;
		
		}
	
	}
}

function clearRotations(){
	
	g_lastRot = g_math.matrix4.identity();
	g_thisRot = g_math.matrix4.identity();
	
	for(i=0;i<oH_obj.length;i++)
	{
		var meshRot = oH_obj[i].transform.localMatrix;
		g_math.matrix4.setUpper3x3(meshRot, g_thisRot);
		oH_obj[i].transform.localMatrix = meshRot;
	
	}
	
}


function stopDragging(e)
{
	g_dragging = false;
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

/*
function enableInput(enable)
{
	document.getElementById("url").disabled = !enable;
	document.getElementById("load").disabled = !enable;
}*/
function copyCam(orig){
	
	var copy = new Object();
	copy.eye = orig.eye.slice(0);
	copy.target = orig.target.slice(0);
	copy.nearPlane = orig.nearPlane;
	copy.farPlane = orig.farPlane;
		
	return copy;	
}


function setClientSize()
{
	var newWidth  = parseInt(g_client.width);
	var newHeight = parseInt(g_client.height);

	if (newWidth != g_o3dWidth || newHeight != g_o3dHeight) 
	{
		g_o3dWidth = newWidth;
		g_o3dHeight = newHeight;

		updateProjection();

		// Sets a new area size for arcball.
		g_aball.setAreaSize(g_o3dWidth, g_o3dHeight);
	}
}

/**
 *  Called every frame.
 */
function onRender(renderEvent) 
{
	// If we don't check the size of the client area every frame we don't get a
	// chance to adjust the perspective matrix fast enough to keep up with the
	// browser resizing us.
	setClientSize();
	
	if(hudCanvasLib && labelVisible){
	
		//someLabel = new Label(hudCanvasLib,"Head",currlabelPos[0],currlabelPos[1],100,40);
	}
		
	if( flashing && flashTimer <= flashDURATION )
	{
			
			flashTimer = flashTimer + renderEvent.elapsedTime*1000;
			/*
			if ((flashTimer % 2*flashINTERVAL) < flashINTERVAL && flashedThisInterval==false ) {
				flashMode = -flashMode;
				
				if(flashType == "COLOR")				
				highlight(flashObject, flashMode);
				else
				highlightMesh(flashMode);
				
				flashedThisInterval = true;
			}
			else if( flashTimer % 2*flashINTERVAL > flashINTERVAL && flashedThisInterval)
			{
				flashedThisInterval = false;
			}
			*/

			if( flashedThisInterval == false )
			{
				flashMode = -flashMode;
				
				if(flashType == "COLOR")				
				highlight(flashObject, flashMode);
				else
				highlightMesh(flashMode);
				
				flashedThisInterval = true;
				flashCounter++;
				
				
			}
			else if( flashedThisInterval == true  && flashTimer > flashINTERVAL*flashCounter )
			{
				
				flashedThisInterval = false;
				
			
			}

	}
	else
	{
			
				if (flashing) {
				//This condition occurs only when the time for flashing runs off with the 
				// flashing flag still true.				
				
					if (flashType == "COLOR") {
						if (flashOrigColor) {
							//We need to restore the object to its original brightness if needed
							highlight(flashObject, -1);
						}
					}
					else {
						if(g_highlightShape)
						highlightMesh(-1);
					}
					flashMode = -1;
					
					//Turn off flashing
					flashing = false;
					
					//Reset counter
					flashTimer   = 0.0;
					flashCounter = 0;
					//Remove orig Color
					flashOrigColor = null;
					g_highlightShape = null;
				}
			
	}
}


/**
 * Removes any callbacks so they don't get called after the page has unloaded.
 */
function uninit() 
{
		
	if (g_client)
	{
		g_client.cleanup();
	}
	
}

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

function pick(e)
{
	
	if (flashing) {
				//This condition occurs only when the time for flashing runs off with the 
				// flashing flag still true.				
				
					if (flashType == "COLOR") {
						if (flashOrigColor) {
							//We need to restore the object to its original brightness if needed
							highlight(flashObject, -1);
						}
					}
					else {
						//Here we need to remove duplicated mesh once the highlighting is done
						if(g_highlightShape)
						highlightMesh(-1);
					}
					flashMode = -1;
					
					//Turn off flashing
					flashing = false;
					
					//Reset counter
					flashTimer = 0.0;
					flashCounter = 0;

					//Remove orig Color
					flashOrigColor = null;
					g_highlightShape = null;
				}
		
	var worldRay = o3djs.picking.clientPositionToWorldRay(
	e.x,
	e.y,
	g_viewInfo.drawContext,
	g_client.width,
	g_client.height
	);
	
	// Update the entire tree in case anything moved.
	g_treeInfo.update();
 
	var pickInfo = g_treeInfo.pick(worldRay);
		
	if ( pickInfo && pickInfo.shapeInfo.parent.transform.name.substr(0,6) != 'unpck_' ) 
	{

		g_selectedInfo = pickInfo;

		for(i=0;i<oH_obj.length;i++)
		{
			if(oH_obj[i].transform.name.replace(/ /,"") == g_selectedInfo.shapeInfo.parent.transform.name.toLowerCase() )
			{
				runEffect("explode");
				//g_loadingElement.innerHTML = g_selectedInfo.shapeInfo.parent.transform.name + ' clicked';
				g_loadingElement.innerHTML = "You clicked on the "+oH_obj[i].labels[0].name + "<br><br>" + 
				oH_obj[i].labels[0].summary + "... <br></br>"+"<a target='_blank' href="+
				oH_obj[i].labels[0].link+">Click to open full article at Wikipedia</a>";
			}
			
		}
		
		if(labelDebug)
		{
			//We create a fake model whose constructor draws an arrow. We do that by passing the root transform directly
			//So there is no mesh involved. Also in place of normal we send the pickinfo object
			fakeTestModel = new Model( g_client.root );
			fakeTestModel.addLabel("debug","bitmap",[0,0,0],pickInfo,"summary","link");
		}
		
		
		if (flashType == "COLOR") {
			
			flashObject = pickInfo.shapeInfo.shape;
			flashing = true;
			flashedThisInterval = false;
		}
		else
		{
			setupHighlightMeshMaterial(pickInfo);
			flashing = true;
			flashedThisInterval = false;
		}
		
		
	} 
	else
	{   
		g_loadingElement.innerHTML = 'Nothing selected';			
	}
}

function dbg_pointOfClick(point,normal)
{
	//Use this function to display the point at which the click occured. This is in order to locate the label arrow's origin
	// for each mesh. Its called only when label_debug is set to true. The point is the location clicked.
	g_loadingElement.innerHTML = "\</position\> \</x\>"+ Math.round(point[0]*100)/100 + " /x y \>" + Math.round(point[1]*100)/100    + " /y\> z\>" + Math.round(point[2]*100)/100   + " /z\> /position\> "
													+" normal\> x\> " + Math.round(normal[0]*100)/100  + " /x\> y\> " + Math.round(normal[1]*100)/100 + " /y\> z\> " + Math.round(normal[2]*100)/100 + " /z\> /normal\> ";

	
}

function hudMouseHandler(e)
{
	var worldRay = o3djs.picking.clientPositionToWorldRay(
	e.x,
	e.y,
	g_hudViewInfo.drawContext,
	g_client.width,			//TODO: Keep track of the HUD Dimensions and pass that
	g_client.height			// For now HUD Dimensions = dimensions of the app view
	);
	
	// Update the entire tree in case anything moved.
	if(g_hud_treeInfo)
	g_hud_treeInfo.update();
  	
	var pickInfo = g_hud_treeInfo.pick(worldRay);
	if (pickInfo) {
		
		
		//	var shapeList = pickInfo.shapeInfo.parent.transform.shapes;
			document.getElementById("footer").innerHTML = pickInfo.shapeInfo.parent.transform.name + ':Name of Button Clicked';
			document.getElementById("footer").innerHTML = "Target at:" + g_camera.target[0] + "," + g_camera.target[1] + "," + g_camera.target[2];
			if(pickInfo.shapeInfo.parent.transform.name == 'panbutton')
			pan(0.5,0,0);
			if(pickInfo.shapeInfo.parent.transform.name == 'rotatebutton')
			pan(-0.5,0,0);
			
			
	}
}

/*
 * Function that highlights the the object by increasing or decreasing its brightness
 * i.e the brightness, by converting RGB to HSV and back
 * Takes a shape argument which is the model to be highlighted
 * Mode is either 1 or -1 depending on whether the object is being lit up or dimmed down
 */
function highlight(model_shape,mode)
{
	
	var element_list = model_shape.elements;
    for (var i = 0; i < element_list.length; i++) {
     	
		var mat_rgba = element_list[i].material.getParam('ambient').value;
	  	
		
		
	  	if(mat_rgba)
		{
			if(!flashOrigColor)
			flashOrigColor = mat_rgba;
			
			if (mode == 1) {
				//First convert RGB to HSV. RGB values used by o3d in [0,1]
				//Thus they need to be multiplied by 256 to bring it to standard format
				mat_hsva = rgbToHsv(mat_rgba[0] * 256, mat_rgba[1] * 256, mat_rgba[2] * 256);
				
				//The fourth alpha parameter may not mean much other than 1 but just in case
				var alpha = mat_rgba[3];
				
				//Increase brightness of the object by 50% of however more possible
				//Or decrease it by the same amount based on the value of mode
				mat_hsva[2] = mat_hsva[2] + mode * (100 - mat_hsva[2]) * 0.1;
				mat_hsva[0] = mat_hsva[0] + mode * (100 - mat_hsva[0]) * 0.1;
				mat_hsva[1] = mat_hsva[1] + mode * (100 - mat_hsva[1]) * 0.1;
				mat_hsva[3] = mat_hsva[3] + mode * (100 - mat_hsva[3]) * 1.0;
				//mat_hsva[0] = 0.162;
				//mat_hsva[1] = 0.592;
				//mat_hsva[2] = 1.000;
				//mat_hsva[3] = 1;
				//0.992, 1.000, 0.329
				//Convert back to RGB			
				mat_rgba = hsvToRgb(mat_hsva[0], mat_hsva[1], mat_hsva[2]);
				
				//Assign these values to element's material			
				element_list[i].material.getParam('ambient').value = [mat_rgba[0] / 256, mat_rgba[1] / 256, mat_rgba[2] / 256, alpha];
			}
			
			else{
				element_list[i].material.getParam('ambient').value = flashOrigColor;
			}
		}
	  
    }
	
}

function highlightMesh(mode)
{
	     	
	if(mode == 1){
		 highlightMeshMaterial();
	}
	else{
		restoreMeshMaterial();
	}
	
}

function setupHighlightMeshMaterial(g_selectedMesh)
{
	
	g_highlightShape =  g_selectedMesh.shapeInfo.shape;
	g_highlightMaterial.getParam('color').value = [0.992, 1.000, 0.329, 1];					  
    // Set all of it's elements to use the highlight material.
    var elements = g_highlightShape.elements;
    for (var ee = 0; ee < elements.length; ee++) {
	origMaterial[ee] = elements[ee].material;
      elements[ee].material = g_highlightMaterial;
    }
	
	
}

function setupVisibilityTree()
{
	
	// Actually the only thing left to enable Visibility Tree Traversal is the array of objects within each model
	// that contains the list of models it encompasses/encloses/contains.
	
	for (var i = 0; i < oH_obj.length; i++) {
		if (oH_obj[i].insideOf != 'none') {
		
			//Then this oH_obj[j] contains some other model
			var container = getModelByName(oH_obj[i].insideOf);
			container.contains[container.contains.length] = oH_obj[i];
			
			//Also setup the within attribute of this model
			oH_obj[i].within = container;
			
		}
		if (oH_obj[i].drawWith != 'none') {
			
			//Then this oH_obj[j] is drawn with another
			// Thus we add it to the list of 
			var model = getModelByName(oH_obj[i].drawWith);
			model.siblings[model.siblings.length] = oH_obj[i];
					
		}	
	}	
		
}

function highlightMeshMaterial()
{
	
	if(g_highlightShape){	
	var elements =  g_highlightShape.elements;
   	 for (var ee = 0; ee < elements.length; ee++) {
		
   		elements[ee].material = g_highlightMaterial;
    	 }
	}

}

function restoreMeshMaterial()
{	
	// Restore all of it's elements to use the highlight material.
	if(g_highlightShape){	
   	 var elements =  g_highlightShape.elements;
   	 for (var ee = 0; ee < elements.length; ee++) {
		
   		elements[ee].material = origMaterial[ee];
    	  }
	}
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

function hideSubModels(model)
{
	//This function marches down the tree recursively starting from model and hides all its children
	
	for(var i=0; i<model.contains.length;i++)
	{
		var subModel = model.contains[i];
	//	alert(subModel.transform.name + ' inside ' + model.transform.name);
		
	//	alert('hiding ' + subModel.transform.name );
		if(subModel)
			if(subModel.drawWith != model.transform.name)
				hide(subModel);
		
		//If child has some submodels within itself. hide those too
		if(subModel.contains.length >0 )
		hideSubModels(subModel);
	}
	
}

function occludeModel(model)
{
	//alert(model.transform.name + ' hidden');
	//Hide this model 
	hide(model);
	
	//but reveal all its immediate children
	for (var i = 0; i < model.contains.length; i++) {
	
		var subModel = model.contains[i];
	//	alert(subModel.transform.name + ' inside ' + model.transform.name);
		
		/*
		//alert('showing ' + subModel.transform.name );
		show(subModel);
		
		//Hide all the submodels of the children though
		if( subModel.contains.length>0 )
		hideSubModels(subModel);
		*/
		revealModel(subModel);		
	}
	
}

function revealModel(model)
{
	//Show this model 
	
	show(model);
	//alert(model.transform.name + ' revealed');
	
	//Also reveal any models that are drawn with this model
	// TODO: Why should this be done every time? It would better to store another array to store
	// all the drawWith objects for each model, iterating just once in setupVisibility tree
	for(var i=0;i<model.siblings.length;i++){
		
		//Show this sibling
		show( model.siblings[i] );
		
		//Hide the sibling's submodels
		hideSubModels(model.siblings[i]);
		
	}
	
	//and hide all models that this one contains
	hideSubModels(model);
	
}

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

function getParentModel(transform)
{
	// A function that iterates through the object list and returns the model
	// that this transform was attached to
	for(var i=0; i<oH_obj.length;i++)
	{
		if(transform.name == oH_obj[i].transform.name)
		return oH_obj[i];
	}
}

function getModelByName(name)
{
	return oH_obj_named_array[name];
}

function Model(o3d_trans)
{
	this.transform 		   = o3d_trans;
	this.name	   		   = null;
	this.label_arrows	   = new Array();
	this.labels			   = new Array();
	this.num_labels 	   = 0;
	this.insideOf 		   = null;				//NOTE: that this is only a string parsed from the XML. To get hold of the object within which this
												// model lies, use the within attribute.	
	this.drawWith 		   = null;
	
	this.siblings		   = new Array();		// A list of objects inside this one
	this.contains   	   = new Array();		// A list of objects that this is drawn with
	
	this.visible  			   = true;
	
}

Model.prototype.addLabel = function(name,bitmap,pos,norm,summary,link)
{
	///add a label arrow first
	this.label_arrows[this.num_labels] = new LabelArrow( pos,norm,this.transform );

	//add a label
	this.labels[this.num_labels]	 = new Label(this.label_arrows[this.num_labels].labelPos,this.transform,bitmap);
	
	this.labels[this.num_labels].name		= name;
	//this.label_arrows[this.num_labels].bitmap	= bitmap;
	this.labels[this.num_labels].pos		= pos;
	this.labels[this.num_labels].normal	= norm;
	this.labels[this.num_labels].summary	= summary;
	this.labels[this.num_labels].link		= link;	
	
	//increase the label count
	this.num_labels++;
};


function LabelArrow(loc,nor,attachTo)
{
	this.attachTo = attachTo;
		this.labelArrowTransform  = g_pack.createObject('Transform');		
		this.labelPos = null;
		
		this.pos = loc;
		this.nor = nor;
		this.drawArrow(this.pos,this.nor);
		
		
}

LabelArrow.prototype.drawArrow = function(loc,nor){
		
		/*
		* Code to draw the arrows to the labels
 		*/
		
		var worldPosition;
		var summedNormal = [0, 0, 0];
		this.labelArrowTransform.parent = this.attachTo;
		var textPos; //We use this variable to track the worldspace location that the text box must appear at
		
		//If the incoming argument is a pickinfo object, its length will be 1; if its a position on the other hand it will be 3
		
		if (labelDebug && nor.length!=3) {
			// Lookup normal of intersection
			// This code assumes that:
			// 1) the primitive is indexed (uses an index buffer)
			// 2) it is a TRIANGLELIST.
			// 3) No offsets are used by the stream
			// 4) That the primitive has a NORMAL stream
			
			var rayInfo = nor.rayIntersectionInfo;
			var shape = nor.shapeInfo.shape;
			var primitive = shape.elements[0];
			var primIndex = rayInfo.primitiveIndex;
			var indexField = primitive.indexBuffer.fields[0];
			var normalField = primitive.streamBank.getVertexStream(g_o3d.Stream.NORMAL, 0).field;
			
			
			// Look up the 3 normals that make the triangle that was picked.
			var indexIndex = primIndex * 3;
			var vertIndices = indexField.getAt(indexIndex, 3);
			
			for (var ii = 0; ii < 3; ++ii) {
				var normal = normalField.getAt(vertIndices[ii], 1);
				summedNormal = g_math.addVector(summedNormal, normal);
			}
			
			summedNormal = g_math.normalize(summedNormal);
									
			// Get the world position of the collision.
			worldPosition = nor.worldIntersectionPosition;
					
			//display the point at debug output
			dbg_pointOfClick(worldPosition,summedNormal);
		
			
		}
		else { //Fixed position Non-debug functionality
			
			
			worldPosition = loc;
			summedNormal = nor;
			
		}
	   
		// Add the normal to it to get a point in space above it with some
 		// multiplier to scale it.
 		var normalSpot = g_math.addVector(
   																	worldPosition,
   																	g_math.mulVectorScalar(summedNormal, 
																											NORMAL_SCALE_FACTOR
  																										  )
																 );
		var depth = 1.5;
				
				
		var subTransform = g_pack.createObject('Transform');	
		subTransform.parent	= this.labelArrowTransform;
						
		 labelArrowShape =  o3djs.primitives.createCylinder(
  					 						  												g_pack,
   					 						 												 labelArrowMaterial,
																						     0.005,		//radius
																							 depth,		//depth
																							 6,		//radial subdivisions
																							 1		//vertical subdivisions
																							 //Multiply by required transform (optional)
																					     );	 
   		
		//Translate the transform to the point of intersection
		this.labelArrowTransform.translate(worldPosition);								
		subTransform.addShape(labelArrowShape);  
		
		var dir = g_math.normalize( g_math.subVector(worldPosition, normalSpot) );
		
		var normalDir       =  g_math.normalize ( g_math.cross( g_camera.eye, [0,1,0] ) );
		var orientedAngle = Math.acos(g_math.dot(dir,normalDir)) * 180/Math.PI;
		
		var cross =  g_math.cross( [0,-1,0],dir );
		var dot		=  g_math.dot([0,-1,0],dir);
		
		var quat   =  o3djs.quaternions.axisRotation( cross, Math.acos(dot) );
		var rot = o3djs.quaternions.quaternionToRotation(quat);
			
		subTransform.quaternionRotate(quat);
		subTransform.translate(0,depth/2,0);
				
		var subTransform2 = g_pack.createObject('Transform');	
		subTransform2.parent	=  this.labelArrowTransform;
		
		var depth2 = 2;
		var pointer =  o3djs.primitives.createCylinder(
  					 						  												g_pack,
   					 						 												 labelArrowMaterial,
																						     0.005,		//radius
																							 depth2,		//depth
																							 6,		//radial subdivisions
																							 1		//vertical subdivisions
																							 
																				);	 
																				
		subTransform2.translate(  g_math.mulVectorScalar(dir,-depth) );
		subTransform2.rotateZ(Math.PI/2);	
				
		if(orientedAngle<90) {
			subTransform2.translate( [0,-depth2/2,0] );
			textPos = g_math.addVector(g_math.addVector(worldPosition , g_math.mulVectorScalar(dir,-depth) ) , [depth2,0,0] );			
		}
		
		else {			
			subTransform2.translate( [0,depth2/2,0] );
				textPos = g_math.addVector(g_math.addVector(worldPosition , g_math.mulVectorScalar(dir,-depth) ) , [-depth2,0,0] );			
		}
	
		/* 
		 * PLEASE DONT REMOVE THE FOLLOWING COMMENTED CODE. IT TRANSFORMS FROM WORLD TO SCREEN COORDS
		 * AND IS LEFT IN THERE FOR FUTURE REFERENCE. YOU CAN DECAPITALIZE THIS REQUEST COMMENT IF YOU WANT
		 * TO MAKE IT SOUND A LITTLE LESS STERN AND LESS LOUD.
		  * /	
		//textPos is now in world coordinates. We need to now transform this to the final coordinates on the screen
		//To this we'll have to multiply it with the view and projection matrix
		
		/*
		var ViewProjectionMatrix = g_math.matrix4.compose(g_viewInfo.drawContext.projection,g_viewInfo.drawContext.view);
		
		this.labelPos				= g_math.matrix4.transformPoint(ViewProjectionMatrix, textPos );
		
		
		var trialCube = o3djs.primitives.createCube(
																			g_pack,
   					 						 								labelArrowMaterial,
																			0.10																																																							
																	  );
		
		var ArrTipTrans = g_pack.createObject('Transform');	
		ArrTipTrans.parent = this.attachTo;
		ArrTipTrans.addShape(trialCube);
		ArrTipTrans.translate(textPos);		
		
		//Transform coord from [-1,1] to [0,2]
		this.labelPos[0]	+=1;
		this.labelPos[1] +=1;		
		
		//Transform coord from [0,2] to [0,1]
		this.labelPos[0] /= 2;
		this.labelPos[1] /= 2;
		
		//Convert to Screen Coord
		this.labelPos[0] *= g_client.width;
		this.labelPos[1] *= g_client.height;
		
		this.labelPos[1] = g_client.height - this.labelPos[1];
		*/
		
		this.labelPos = textPos;				 
		subTransform2.addShape(pointer);
						
		o3djs.pack.preparePack(g_pack, g_viewInfo);
	
};

/*
LabelArrow.prototype.hideArrow() =function(){
		
	labelTransform.visible = false;
	document.getElementById("footer").innerHTML = "";

};

*/

function Label( position, attachTo, bitmap){
	
	
	this.position	 = position;
	this.attachTo	 = attachTo;
	this.labelHolder = g_pack.createObject('Transform');
	this.labelHolder.parent = this.attachTo;
	this.bitmap		 = "assets/bitmaps/" + bitmap;
	
	this.labelHolder.translate(position);
	
	
	
	this.currNor = null;
	this.texture = g_textures[this.bitmap];
	 
	 if(this.texture)
	 this.image = new LabelImage(this.texture,false,this.labelHolder,this.bitmap);
	 else
	 alert("No texture");
	
}


/**
 *  Encapsulation of an image
 * @param {Object} texure The texture to use in the Image
 * @param {boolean} opt_topLeft indicating the positioning of the texture
 * @param {Object} attachTo Parent Transform to attach this image to
 * 
 */
function LabelImage(texture, opt_topLeft,attachTo,name) {

      
   	var baseWidth  = 0.6; //Corresponds to the width with which the 'head' label appears most pleasing (arguably)
   	var baseHeight = 0.3; 
		
	
	var strWidthFactor = baseWidth*texture.width/g_textures["assets/bitmaps/head.png"].width;
	
			
  // create a transform for positioning
  this.transform = g_pack.createObject('Transform');
  this.transform.parent = attachTo;
  this.transform.name = "unpck_" + name;

 
  // create a transform for scaling to the size of the image just so
  // we don't have to manage that manually in the transform above.
  this.scaleTransform = g_pack.createObject('Transform');
  this.scaleTransform.parent = this.transform;
  this.scaleTransform.name = "unpck_" + name;

  
  // setup the sampler for the texture
  this.material = o3djs.material.createMaterialFromFile( g_pack, 
															   'shaders/billboard.shader', 
															   g_viewInfo.zOrderedDrawList
														);
  var sampler = this.material.getParam('texSampler0').value;
  sampler.texture = texture;
  sampler.addressModeU = g_o3d.Sampler.BORDER;
  sampler.addressModeV = g_o3d.Sampler.BORDER;
  sampler.borderColor = [1, 0, 0, 1];
  sampler.minFilter			= g_o3d.Sampler.ANISOTROPIC;
  sampler.maxAnisotropy = 4;
  sampler.magFilter			= g_o3d.Sampler.LINEAR;
  sampler.mipFilter			= g_o3d.Sampler.LINEAR;
 /*
  // Setup our UV offsets and color multiplier
  this.paramColorMult = this.scaleTransform.createParam('colorMult','ParamFloat4');
 
  this.setColor(1, 1, 1, 1);
 */

	// Create and bind standard params so we can see the light parameters
  // for the standard shaders globably.
  g_globalParams = o3djs.material.createAndBindStandardParams(g_pack);
  g_globalParams.lightWorldPos.value = [30, 60, 40];
  g_globalParams.lightColor.value 		= [1, 1, 1, 1];


  // Create a 2d plane for images. createPlane makes an XZ plane by default
  // so we pass in matrix to rotate it to an XY plane. We could do
  // all our manipluations in XZ but most people seem to like XY for 2D.
  	this.plane = o3djs.primitives.createPlane(
  					    g_pack,
   					    this.material,
					 	baseWidth*strWidthFactor*LABEL_SIZE_FACTOR,
   					    baseHeight,						
					    1,
   					    1,
						g_math.matrix4.rotationX( g_math.degToRad(90) )
						);
						
						/*
						,
  					    [[1, 0, 0, 0],
  					    [0, 0, 1, 0],
   					    [0,1, 0, 0],
  					    [0, 0, 0, 1]]);
 						*/
 

  this.scaleTransform.addShape(this.plane);
  
  if (opt_topLeft) {
    this.scaleTransform.translate(texture.width / 2, texture.height / 2, 0);
  }
  
  this.scaleTransform.scale(texture.width, -texture.height, 1);
     
   o3djs.pack.preparePack(g_pack, g_viewInfo);
   updateInfo();
}

/**
 * Sets the color multiplier for the image.
 * @param {number} r Red component.
 * @param {number} g Green component.
 * @param {number} b Blue component.
 * @param {number} a Alpha component.
 */
LabelImage.prototype.setColor = function(r, g, b, a) {
  this.paramColorMult.set(r, g, b, a);
};

/**
 * Loads a texture and saves it in the g_textures array.
 * @param {Object} loader The loader to load with.
 * @param {stinrg} url of texture to load
 * @param {number} index Index to put texture in g_textures
 * 
 */
function loadTexture(loader, filename) {
  loader.loadTexture(g_pack,
                     o3djs.util.getAbsoluteURI( filename),
                     rememberTexture);

  function rememberTexture(texture, exception) {
    if (exception) {
      alert(exception);
    } else {
    g_textures[filename] = texture;
    }
  }
}




/*
*	The following RGB-HSV code is courtesy of Matt Haynes
* 	taken from http://matthaynes.net/blog/2008/08/07/javascript-colour-functions/
*/
/**
* Converts HSV to RGB value.
*
* @param {Integer} h Hue as a value between 0 - 360 degrees
* @param {Integer} s Saturation as a value between 0 - 100 %
* @param {Integer} v Value as a value between 0 - 100 %
* @returns {Array} The RGB values  EG: [r,g,b], [255,255,255]
*/
function hsvToRgb(h,s,v) {

    var s = s / 100,
         v = v / 100;

    var hi = Math.floor((h/60) % 6);
    var f = (h / 60) - hi;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    var rgb = [];

    switch (hi) {
        case 0: rgb = [v,t,p];break;
        case 1: rgb = [q,v,p];break;
        case 2: rgb = [p,v,t];break;
        case 3: rgb = [p,q,v];break;
        case 4: rgb = [t,p,v];break;
        case 5: rgb = [v,p,q];break;
    }

    var r = Math.min(255, Math.round(rgb[0]*256)),
        g = Math.min(255, Math.round(rgb[1]*256)),
        b = Math.min(255, Math.round(rgb[2]*256));

    return [r,g,b];

}	

/**
* Converts RGB to HSV value.
*
*
* 
* @param {Integer} r Red value, 0-255
* @param {Integer} g Green value, 0-255
* @param {Integer} b Blue value, 0-255
* @returns {Array} The HSV values EG: [h,s,v], [0-360 degrees, 0-100%, 0-100%]
*/
function rgbToHsv(r, g, b) {

    var r = (r / 255),
         g = (g / 255),
  	 b = (b / 255);	

    var min = Math.min(Math.min(r, g), b),
        max = Math.max(Math.max(r, g), b),
        delta = max - min;

    var value = max,
        saturation,
        hue;

    // Hue
    if (max == min) {
        hue = 0;
    } else if (max == r) {
        hue = (60 * ((g-b) / (max-min))) % 360;
    } else if (max == g) {
        hue = 60 * ((b-r) / (max-min)) + 120;
    } else if (max == b) {
        hue = 60 * ((r-g) / (max-min)) + 240;
    }

    if (hue < 0) {
        hue += 360;
    }

    // Saturation
    if (max == 0) {
        saturation = 0;
    } else {
        saturation = 1 - (min/max);
    }

    return [Math.round(hue), Math.round(saturation * 100), Math.round(value * 100)];
}
