$(document).ready(function(){  
  $("#dialog").dialog({ autoOpen: false });
  $("a#dialog_link").click(function(){$("#dialog").dialog("open");});
  $("#dialog2").dialog({ autoOpen: false });
  $("a#dialog_link2").click(function(){$("#dialog2").dialog("open");});
});
