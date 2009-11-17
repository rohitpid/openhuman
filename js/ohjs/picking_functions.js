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
		var selectedModel;

		for(i=0;i<oH_obj.length;i++)
		{
			if(oH_obj[i].transform.name.replace(/ /,"") == g_selectedInfo.shapeInfo.parent.transform.name.toLowerCase() )
			{
				runEffect("explode");
				//g_loadingElement.innerHTML = g_selectedInfo.shapeInfo.parent.transform.name + ' clicked';
				g_loadingElement.innerHTML = "You clicked on the "+oH_obj[i].labels[0].name + "<br><br>" + 
				oH_obj[i].labels[0].summary + "... <br></br>"+"<a target='_blank' href="+
				oH_obj[i].labels[0].link+">Click to open full article at Wikipedia</a>";
				selectedModel = oH_obj[i];
			}
			
		}
		
		if(labelDebug)
		{
			//We create a fake model whose constructor draws an arrow. We do that by passing the root transform directly
			//So there is no mesh involved. Also in place of normal we send the pickinfo object
			debug_arrows_transform_array[debug_arrows_transform_array.length] 		   = g_pack.createObject('Transform');
			debug_arrows_transform_array[debug_arrows_transform_array.length-1].parent = g_client.root;
			
			fakeTestModel = new Model( debug_arrows_transform_array[debug_arrows_transform_array.length-1] );
			fakeTestModel.addLabel("debug","bitmap",[0,0,0],pickInfo,"summary","link",selectedModel);
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
