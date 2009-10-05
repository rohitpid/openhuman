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

LabelArrow.prototype.drawArrow = function(loc,nor)
{
		
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

function Label( position, attachTo, bitmap)
{
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
function LabelImage(texture, opt_topLeft,attachTo,name)
{

      
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
LabelImage.prototype.setColor = function(r, g, b, a)
{
  this.paramColorMult.set(r, g, b, a);
};

/**
 * Loads a texture and saves it in the g_textures array.
 * @param {Object} loader The loader to load with.
 * @param {stinrg} url of texture to load
 * @param {number} index Index to put texture in g_textures
 * 
 */
function loadTexture(loader, filename)
{
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

/***************************************************************************/
// For some reason the model constructor below has to be in this file for the labels to work

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
