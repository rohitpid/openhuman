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
