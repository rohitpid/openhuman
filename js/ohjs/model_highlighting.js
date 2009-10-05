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
function hsvToRgb(h,s,v)
{

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
function rgbToHsv(r, g, b)
{

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
