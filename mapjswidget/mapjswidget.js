require('mapjs:/lib/jquery.mousewheel-3.1.3.js');
require('mapjs:/lib/jquery.hotkeys.js');
require('mapjs:/lib/jquery.hammer.min.js');
require('mapjs:/lib/underscore-1.4.4.js');
require('mapjs:/lib/kinetic-v4.5.4.js');
require('mapjs:/lib/color-0.4.1.min.js');
require('mapjs:/src/kinetic.clip.js');
require('mapjs:/src/kinetic.idea.js');
require('mapjs:/src/kinetic.connector.js');
require('mapjs:/src/kinetic.link.js');
require('mapjs:/src/observable.js');
require('mapjs:/src/mapjs.js');
require('mapjs:/src/url-helper.js');
require('mapjs:/src/content.js');
require('mapjs:/src/layout.js');
require('mapjs:/src/clipboard.js');
require('mapjs:/src/map-model.js');
require('mapjs:/src/drag-and-drop.js');
require('mapjs:/src/kinetic-mediator.js');
require('mapjs:/src/map-toolbar-widget.js');
require('mapjs:/src/png-exporter.js');
require('mapjs:/src/map-widget.js');
require('mapjs:/src/link-edit-widget.js');
require('mapjs:/src/image-drop-widget.js');
//require('mapjs:/test/perftests.js');


/*
Note that for now, we cannot have more than one MapJSWidget on the same page
*/

function MapJSWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.initialize=function() {return _initialize();};
	this.setMap=function(map) {return _setMap(map);};
	this.getMap=function(node_id) {return _getMap(node_id);};
	this.setInputEnabled=function(val) {m_input_enabled=val; m_map_model.setInputEnabled(val);};
	this.onOpenAttachment=function(callback) {m_attachment_callback=callback;};
	this.getNodeData=function(node_id) {return _getNodeData(node_id);};
	this.setNodeAttachment=function(node_id,attachment) {_setNodeAttachment(node_id,attachment);};
	this.addNode=function(parent_node_id,node_data) {_addNode(parent_node_id,node_data);};
	this.replaceNode=function(node_id,node_data) {_replaceNode(node_id,node_data);};
	this.removeNode=function(node_id) {_removeNode(node_id);};
	this.getRootNodeId=function() {return (m_idea||{}).id||null;};
	this.setStyleFunction=function(func) {m_style_function=func;};
	this.testfunc=function(params) {return _testfunc(params);};
	this.getSelectedNodeId=function() {return _getSelectedNodeId();};
	this.onKeyPressed=function(callback) {m_div.bind('on-key-pressed',function(evt,obj) {callback(obj);});};
	this.refreshMap=function() {that.setMap(that.getMap());};
	this.onContextMenuRequested=function(callback) {m_div.bind('on-context-menu-requested',function(evt,obj) {callback(obj);});};	
	this.onSelectedNodeChanged=function(callback) {m_div.bind('on-selected-node-changed',function() {callback();});};
	
	var m_div_id='mapjswidget-'+makeRandomId(5); //seems to be important that the div has a unique id
	var m_div=$('<div id="'+m_div_id+'"></div>');
	var m_map_model=null;
	var m_idea={};
	var m_last_ids={last_neg:0,last_pos:0};
	var m_input_enabled=true;
	var m_attachment_callback=function(node_id) {console.log ('attachment callback not defined',node_id);};
	var m_style_function=null;
	
	//initialize the map model
	var isTouch=false; //I am guessing this would be true on a touch screen?
	var imageInsertController=new MAPJS.ImageInsertController("http://localhost:4999?u="); //not sure about this
	m_map_model=new MAPJS.MapModel(MAPJS.KineticMediator.layoutCalculator, []);
	
	m_map_model.addEventListener('attachmentOpened', function (nodeId, attachment) {
		//for debugging purposes, it is better to do it this way, so we can see the errors in console
		setTimeout(function() {
			m_attachment_callback(nodeId);
		},10);
	});
	
	m_map_model.addEventListener('nodeTitleChanged',function(node) {
		update_node_styles();
	});
	
	m_map_model.addEventListener('contextMenuRequested',function(node_id,x,y) {
		m_div.trigger('on-context-menu-requested',{node_id:node_id,x:x,y:y});
	});
	
	m_map_model.addEventListener('nodeSelectionChanged',function() {
		m_div.trigger('on-selected-node-changed');
	});
	
	$(document).keypress(function (evt) {
		var key=String.fromCharCode(evt.which);
		if (!m_input_enabled) return;
		//if (key=='c') do_copy();
		//else if (key=='v') do_paste();
		var idea=get_selected_idea();
		var node_id=idea.id||null;
		m_div.trigger('on-key-pressed',{node_id:node_id,key:key,event:evt});
	});
	
	function _initialize() {
		m_div.mapWidget(console,m_map_model,isTouch,imageInsertController);
		
		//jQuery('body').attachmentEditorWidget(m_map_model);
	}
	
	function get_next_id(negative) {
		if (!negative) {
			m_last_ids.last_pos++;
			return m_last_ids.last_pos;
		}
		else {
			m_last_ids.last_neg--;
			return m_last_ids.last_neg;
		}
	}
	function convert_node(node) {
		var ret={};
		ret.title=node.title||'';
		ret.attributes=$.extend({},(node.attributes||{}));
		ret.attr={};
		if (node.attachment) ret.attr.attachment=$.extend({},node.attachment);
		if (node.collapsed) ret.attr.collapsed=true;
		ret.attr.style={};
		ret.id=get_next_id(node.negative||false);
		ret.ideas={};
		var children=node.children||[];
		
		/*
		var max_items_to_display=8;
		if (children.length>max_items_to_display) {
			ret.ideas_are_hidden=true;
			ret.ideas={};
			var tmp1=convert_node({title:'['+children.length+' items]',collapsed:true});
			tmp1.ideas={};
			ret.ideas[tmp1.id]=tmp1;
			ret.holder_id=tmp1.id;
		}
		*/
		var holder=ret;
		//if (ret.ideas_are_hidden) holder=ret.ideas[ret.holder_id];
		for (var i=0; i<children.length; i++) {
			var tmp=convert_node(children[i]);
			holder.ideas[tmp.id]=tmp;
		}
		
		return ret;
	}
	function deconvert_node(idea,recursive) {
		var node={};
		node.title=idea.title||'';
		node.attributes=$.extend({},(idea.attributes||{}));
		node.children=[];
		if ((idea.attr)&&(idea.attr.attachment)) node.attachment=$.extend({},idea.attr.attachment);
		if ((idea.attr)&&(idea.attr.collapsed)) node.collapsed=true;
		var ideas=idea.ideas||{};
		/*
		if ((idea.ideas_are_hidden)&&(idea.holder_id)) {
			ideas=idea.ideas[idea.holder_id].ideas||{};
			for (var kk in idea.ideas) {
				if (kk!=idea.holder_id) ideas.push(idea.ideas[kk]);
			}
		}
		else ideas=idea.ideas||{};
		*/
		
		if (recursive) {
			for (var idea_key in ideas) {
				var is_negative=(Number(idea_key)<0);
				var node2=deconvert_node(ideas[idea_key],recursive);
				if (is_negative) node2.negative=true;
				node.children.push(node2);
			}
		}
		return node;
	}
	
	function get_idea_from_id(node_id) {
		if (node_id==m_idea.id) {
			return m_idea;
		}
		else {
			return m_idea.findSubIdeaById(node_id);
		}
	}
	function _getNodeData(node_id) {
		var idea=get_idea_from_id(node_id);
		if (!idea) return null;
		var node=deconvert_node(idea,false);
		node.child_ids_by_title={};
		var ideas=idea.ideas||{};
		for (var key in ideas) {
			var id0=ideas[key].id;
			var title0=ideas[key].title;
			node.child_ids_by_title[title0]=id0;
		}
		node.parent_node_id=(m_idea.findParent(node_id)||{}).id||null;
		return node;
	}
	function _getSelectedNodeId() {
		var idea=get_selected_idea();
		if (!idea) return null;
		var node_id=idea.id||null;
		return node_id;
	}
	function get_selected_idea() {
		var idea_id=m_map_model.getSelectedNodeId();
		var selected_idea=get_idea_from_id(idea_id);
		if (selected_idea) return selected_idea;
		else return null;
	}
	
	function do_copy() {
		var idea=get_selected_idea();
		if (idea) {
			var node=deconvert_node(idea,true);
			localStorage.mapjswidget_clipboard=JSON.stringify(node);
		}
	}
	function do_paste() {
		var tmp=localStorage.mapjswidget_clipboard||'';
		try {
			var node=JSON.parse(tmp);
		}
		catch(err) {
			return;
		}
		var idea=get_selected_idea();
		if (!idea.ideas) idea.ideas={};
		idea.ideas[get_next_id()]=convert_node(node);
		that.setMap(that.getMap());
	}
	function _testfunc(params) {
		if (params=='copy') {
		}
		else if (params=='paste') {
		}
		
	}
	
	function _setNodeAttachment(node_id,attachment) {
		m_map_model.setAttachment(
			'mapjswidget',
			node_id,{
				contentType:attachment.contentType||'text/plain',
				content:attachment.content||''
			}
		);
	}
	function _addNode(parent_node_id,node_data) {
		var idea=get_idea_from_id(parent_node_id);
		if (!idea) return;
		if (!idea.ideas) idea.ideas={};
		idea.ideas[get_next_id()]=convert_node(node_data);
		//that.setMap(that.getMap()); //removed for efficiency... caller should use that.refreshMap();
	}
	function _replaceNode(node_id,node_data) {
		var parent_node_id=(m_idea.findParent(node_id)||{}).id||null;
		if (!parent_node_id) return;
		var par_idea=get_idea_from_id(parent_node_id);
		if (!par_idea) return;
		
		var new_ideas={};
		for (var key in par_idea.ideas) {
			if (par_idea.ideas[key].id==node_id)
				new_ideas[key]=convert_node(node_data);
			else
				new_ideas[key]=par_idea.ideas[key];
		}
		par_idea.ideas=new_ideas;
	}
	
	function _removeNode(node_id) {
		
		var parent_node_id=(m_idea.findParent(node_id)||{}).id||null;
		if (!parent_node_id) return;
		var par_idea=get_idea_from_id(parent_node_id);
		if (!par_idea) return;
		if (!par_idea.ideas) return;
		var new_ideas={};
		for (var key in par_idea.ideas) {
			if (par_idea.ideas[key].id!=node_id)
				new_ideas[key]=par_idea.ideas[key];
		}
		par_idea.ideas=new_ideas;

	}
	
	function _setMap(map) {
		m_last_ids={last_neg:0,last_pos:0};
		var map_tmp=convert_node(map.root||{});
		map_tmp.formatVersion=2;
		
		//set the idea to the model
		m_idea=MAPJS.content(map_tmp);
		update_node_styles();
		
		m_map_model.setIdea(m_idea);
	}
	function _getMap(node_id) {
		var tmp=m_map_model.getIdea(); 
		if (!tmp) return null;
		var tmp2=tmp;
		if (node_id) {
			tmp2=tmp.findSubIdeaById(node_id);
			if (!tmp2) return null;
		}
		var tmp3=tmp.clone(tmp2.id);
		var root=deconvert_node(tmp3,true);
		return {root:root};
	}
	
	function update_layout() {
		m_div.css({position:'absolute',width:m_width,height:m_height});
		schedule_resize_notification();
	}
	
	var m_resize_notification_scheduled=false;
	function schedule_resize_notification() {
		if (m_resize_notification_scheduled) return;
		m_resize_notification_scheduled=true;
		setTimeout(do_resize_notification,200);
		function do_resize_notification() {
			m_resize_notification_scheduled=false;
			m_div.trigger('on-resized');
		}
	}
	
	function update_node_styles() {
		update_node_styles_2(m_idea,true);
	}
	function update_node_styles_2(idea,is_root) {
		var title=idea.title||'';
		var suf=utils.get_file_suffix(title);
		if (!idea.attr) idea.attr={};
		if (!idea.attr.style) idea.attr.style={};
		var style=idea.attr.style;
		
		var data={
			title:idea.title||'',
			attachment:idea.attachment||{},
			is_root:is_root
		};
		
		if (m_style_function) {
			m_style_function(data,style);
		}
	
		for (var key in idea.ideas) {
			update_node_styles_2(idea.ideas[key],false);
		}
	}
}

