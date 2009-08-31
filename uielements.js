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

 $(function() {
	$("a#dialog_hotkeys").toggle(function() {
		$("#instructions_box").slideDown(1000);
	}, function() {
		$("#instructions_box").slideUp(1000);
	});


	// change defaults for range, animate and orientation
	$.extend($.ui.slider.defaults, {
		range: "min",
		animate: true,
		orientation: "vertical"
	});
	// setup control for zooming in and out
	var interval = false;
	$("#zoomscroller").slider({
		value: 50,
		min: 0,
	        max: 100,		
	        start: function(e,ui){
	        },
	        stop: function(e,ui){
		$(this).slider('value',50);
		window.clearInterval(interval);
		interval = false;
	        },
	        slide: function(e,ui){
			if($(this).slider('value')>50)
			{
				if( interval === false )
					interval=setInterval("zoomScroller(110/111)",10);
			}
			else if($(this).slider('value')<50)
			{
				if( interval === false  )
					interval=setInterval("zoomScroller(112/111)",10);
			}
		}
	});

	// setup control for scaling objects
	var lastValue=1;
	$("#scalingscroller").slider({
		value: 1,		
		min: 1,
	        max: 30,		
	        start: function(e,ui){
	        },
	        stop: function(e,ui){
	        },
	        slide: function(e,ui){
			//console.log("value on slider "+$(this).slider('value'));
			//console.log("last value on slider "+lastValue);
			scale(($(this).slider('value')/lastValue));
			lastValue=$(this).slider('value');
		}
	});

	$("a#dialog_link").animate({"opacity": .7 });	$("a#dialog_link").hover(function() {
		$(this).stop().animate({ "opacity": 1 });
	}, function() {
		$(this).stop().animate({ "opacity": .7 });
	});

	$("a#dialog_link2").animate({"opacity": .7 });	$("a#dialog_link2").hover(function() {
		$(this).stop().animate({ "opacity": 1 });
	}, function() {
		$(this).stop().animate({ "opacity": .7 });
	});

	var angleLast=0;
	$('#indicator').Draggable(
		{
			onDragModifier : function(x,y)
			{
				var centerx = 138;
				var centery = 108;
				var angle = Math.atan((centery-y)/(centerx-x));
			//	console.log("x is "+x);
			//	console.log("centerx is "+centerx);
			//	console.log("y is "+y);
			//	console.log("centery is "+centery);
			//	console.log("atan of above is "+angle);
				var angle2 = angle;
				if((centerx-x)>=0)
					angle += Math.PI;
				if(centerx>=x)
					angle2 += Math.PI;
				angle2 += (Math.PI/2);
				radius = 46;
			//	console.log("angleLast is "+angleLast);
			//	console.log("angle2 is "+angle2);
			//	rotateZ(angle2-angleLast);
				buttonRotation(-angle2+angleLast,2);
				angleLast=angle2;
				return {
					x: radius * Math.cos(angle) + centerx, 
					y: radius * Math.sin(angle) + centery
				}
			}
		});

	$('#pan_up').click(function(){
	pan(0,0.5,0);
	});
	$('#pan_down').click(function(){
	pan(0,-0.5,0);
	});
	$('#pan_right').click(function(){
	pan(0.5,0,0);
	});
	$('#pan_left').click(function(){
	pan(-0.5,0,0);
	});
	$('#rot_up').click(function(){
	buttonRotation(Math.PI/18,0);
	//o3d.Transform.axisRotate(new Array(0,0,1),Math.PI/18);
	});
	$('#rot_down').click(function(){
	buttonRotation(-Math.PI/18,0);
	});
	$('#rot_left').click(function(){
	buttonRotation(-Math.PI/18,1);
	});
	$('#rot_right').click(function(){
	buttonRotation(Math.PI/18,1);
	});

	$(function(){
		//all hover and click logic for buttons
		$(".fg-button:not(.ui-state-disabled)")
		.hover(
			function(){ 
				$(this).addClass("ui-state-hover"); 
			},
			function(){ 
				$(this).removeClass("ui-state-hover"); 
			}
		)
		.mousedown(function(){
				$(this).parents('.fg-buttonset-single:first').find(".fg-button.ui-state-active").removeClass("ui-state-active");
				if( $(this).is('.ui-state-active.fg-button-toggleable, .fg-buttonset-multi .ui-state-active') ){ $(this).removeClass("ui-state-active"); }
				else { $(this).addClass("ui-state-active"); }	
		})
		.mouseup(function(){
			if(! $(this).is('.fg-button-toggleable, .fg-buttonset-single .fg-button,  .fg-buttonset-multi .fg-button') ){
				$(this).removeClass("ui-state-active");
			}
		});
	});

	$("#hide").click(function(){
	hide();
	});
	$("#show").click(function(){
	show();
	});
	$("#hideall").click(function(){
	hideall();
	});
	$("#showall").click(function(){
	showall();
	});
	$("#reset").click(function(){
	cam.setPosition([0,0,10]);
	cam.setLookAtPoint([0,0,0]);
	showall();
	});
	$("#instructions").click(function(){
	g_loadingElement.innerHTML ="Use the Controls above to zoom,scale,rotate and pan around the body<br></br>Other Features: <br>-- Right click on an object to select organ<br>-- Info button opens wikipedia article about organ<br>-- Hide button hides selected organ <br>-- Hide All button hides all organs<br>-- Show All button shows all organs"
	runEffect("explode");
	//$("#information").show();
	});
});

		//run the currently selected effect
		function runEffect(effect){
			//get effect type from 
			var selectedEffect = effect;
			
			//most effect types need no options passed by default
			var options = {};
			//check if it's scale, transfer, or size - they need options explicitly set
			if(selectedEffect == 'scale'){  options = {percent: 100}; }
			else if(selectedEffect == 'transfer'){ options = { to: "#button", className: 'ui-effects-transfer' }; }
			else if(selectedEffect == 'size'){ options = { to: {width: 280,height: 185} }; }
			
			//run the effect
			if(selectedEffect=="explode")
			$("#information").show(selectedEffect,options,500,effectCallback);
			else
			$("#information").effect(selectedEffect,options,500,effectCallback);
		};

		//callback function to bring a hidden box back
		function effectCallback(){
			setTimeout(function(){
				$("#information:hidden").removeAttr('style').hide().fadeOut();
			}, 500);
		};

