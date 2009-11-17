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
var debug_arrows_transform_array = [];


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
 * init() Creates the client area.
 */
function init()
{
	o3djs.util.makeClients(initStep2,"LargeGeometry");
}

/**
 * Initializes O3D and loads the scene into the transform graph.
 * @param {Array} clientElements Array of o3d object elements.
 */
function initStep2(clientElements)
{
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
	
	debug_arrows_transform_array = new Array();
	
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

/**
 * initStep3() performs the 3rd stage of loading
 * and loads models and labels after the loading 
 * of the bitmaps is performed by the loader at the
 * end of initStep2.
 */
function initStep3()
{

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

/**
 * Function description
 * @Param {type}
 * @return {type}
 * @see
 */
function updateInfo()
{
	if (!g_treeInfo) 
	{
		g_treeInfo = o3djs.picking.createTransformInfo(g_client.root,null);
	}
	g_treeInfo.update();
}

/**
 * Function description
 * @Param {type}
 * @return {type}
 * @see
 */
function clearRotations()
{
	
	g_lastRot = g_math.matrix4.identity();
	g_thisRot = g_math.matrix4.identity();
	
	for(i=0;i<oH_obj.length;i++)
	{
		var meshRot = oH_obj[i].transform.localMatrix;
		g_math.matrix4.setUpper3x3(meshRot, g_thisRot);
		oH_obj[i].transform.localMatrix = meshRot;
	
	}
	
}

/*
function enableInput(enable)
{
	document.getElementById("url").disabled = !enable;
	document.getElementById("load").disabled = !enable;
}*/

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
 *  onRender() is called every frame. We execute flashing here
 *  and we call setClientSize to ensure our div is sized proportional
 *  to the window that it is in.
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
