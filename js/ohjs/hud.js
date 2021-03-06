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

function updateHUDInfo()
{
	if (!g_hud_treeInfo) 
	{
		g_hud_treeInfo = o3djs.picking.createTransformInfo(g_hudRoot,null);
	}
	
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
