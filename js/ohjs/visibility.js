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
