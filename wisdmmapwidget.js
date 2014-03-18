require('mapjswidget/mapjswidget.js');
require('wisdmmapeditor.js');
require('pushpull.js');
require('actiontoolbar.js');
require('upload_file.js');
require('statuswidget.js');
require('create_app_files.js');
require('outputwindow.js');

function WisdmMapWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.initialize=function() {return _initialize();};
	this.setMap=function(map) {return m_mapjs_widget.setMap(map);};
	this.getMap=function() {return m_mapjs_widget.getMap();};
	this.loadStoredMap=function() {load_stored_map();};
	this.loadTemporaryCloudFile=function(key) {_loadTemporaryCloudFile(key);};
	this.hasBeenModified=function() {return _hasBeenModified();};
	
	var m_width=0;
	var m_height=0;
	var m_editor_expand_level=1; //0,1,2,3
	var m_div=templateHtml('.wisdmmapwidget');
	var m_mapjs_widget=new MapJSWidget();
	var m_output_window=new OutputWindow();
	var m_editor=new WisdmMapEditor();
	var m_file_toolbar=new ActionToolbar();
	var m_node_toolbar=new ActionToolbar();
	var m_view_toolbar=new ActionToolbar();
	var m_edit_toolbar=new ActionToolbar();
	var m_status_widget=new StatusWidget();
	var m_last_clean_hash='';
	var m_temporary_cloud_file_name='';
	var m_view_mode='map';
	m_div.find('.map_holder').append(m_mapjs_widget.div());
	m_div.find('.map_holder').append(m_output_window.div());
	m_div.find('.editor_holder').append(m_editor.div());
	m_div.find('.status_holder').append(m_status_widget.div());
	m_div.find('.toolbar_holder').append(m_file_toolbar.div());
	m_div.find('.toolbar_holder').append(m_node_toolbar.div());
	m_div.find('.toolbar_holder').append(m_view_toolbar.div());
	m_div.find('.toolbar_holder').append(m_edit_toolbar.div());
	
	m_mapjs_widget.div().addClass('map_widget');
	m_mapjs_widget.onOpenAttachment(on_edit_attachment);
	m_mapjs_widget.onKeyPressed(on_map_key_pressed);
	m_mapjs_widget.onContextMenuRequested(on_node_context_menu);
	m_mapjs_widget.onSelectedNodeChanged(on_selected_node_changed);
	m_mapjs_widget.setStyleFunction(style_function);
	
	m_editor.div().addClass('editor_widget');
	m_editor.onSave(on_editor_save);
	m_editor.onExpand(on_editor_expand);
	m_editor.onCollapse(on_editor_collapse);
	m_editor.setExpandButtonVisible(true);
	m_editor.setCollapseButtonVisible(true);
	
	m_status_widget.setDefaultStatus('Ready.');
	update_default_status();
	
	var img_path='http://'+location.hostname+'/dev/resources/images/yusukekamiyamane';
	
	m_file_toolbar.setOrientation('vertical');
	m_file_toolbar.addAction('save_map_local',{title:'Save map to local (browser) storage. Note that only one map at a time can be saved to the browser storage.',callback:on_save_map_local,image_url:img_path+'/application-browser.png',image_size:[16,16]});
	m_file_toolbar.addAction('save_map_cloud',{title:'Save map to temporary cloud.',callback:on_save_map_cloud,image_url:img_path+'/upload-cloud.png',image_size:[16,16]});
	m_file_toolbar.addAction('upload_map',{title:'Upload map',callback:on_upload_map,image_url:img_path+'/drive-upload.png',image_size:[16,16]});
	m_file_toolbar.addAction('download_map',{title:'Download map',callback:on_download_map,image_url:img_path+'/drive-download.png',image_size:[16,16]});	
	//uses jquery.hotkeys
	$(document).bind('keydown','ctrl+s', function(e) {e.preventDefault(); on_save_map_local(); return false;});
	
	m_node_toolbar.setOrientation('vertical');
	m_node_toolbar.addAction('cut_node',{title:'Cut node (Ctrl+X)',callback:on_cut_node,image_url:img_path+'/scissors.png',image_size:[16,16]});
	m_node_toolbar.addAction('copy_node',{title:'Copy node (Ctrl+C)',callback:on_copy_node,image_url:img_path+'/document-copy.png',image_size:[16,16]});
	m_node_toolbar.addAction('paste_node',{title:'Paste node (Ctrl+V)',callback:on_paste_node,image_url:img_path+'/clipboard-paste.png',image_size:[16,16]});
	m_node_toolbar.addAction('push_files',{title:'Push files',callback:on_push_files,image_url:img_path+'/upload-linux.png',image_size:[16,16]});
	m_node_toolbar.addAction('pull_files',{title:'Pull files',callback:on_pull_files,image_url:img_path+'/download-linux.png',image_size:[16,16]});
	m_node_toolbar.addAction('create_app',{title:'Create app',callback:on_create_app,image_url:img_path+'/application-browser.png',image_size:[16,16]});
	m_node_toolbar.addAction('update_server_files',{title:'Update server files ',callback:on_update_server_files,image_url:img_path+'/application-browser.png',image_size:[16,16]});
	//uses jquery.hotkeys
	$(document).bind('keydown','ctrl+x', function() {on_cut_node();});
	$(document).bind('keydown','ctrl+c', function() {on_copy_node();});
	$(document).bind('keydown','ctrl+v', function() {on_paste_node();});
	m_node_toolbar.hideActions(['push_files','pull_files','create_app','update_server_files']);
	
	m_view_toolbar.setOrientation('vertical');
	m_view_toolbar.addAction('toggle_editor_view',{title:'Toggle editor view',callback:on_toggle_editor_view,image_url:img_path+'/document-code.png',image_size:[16,16]});
	m_view_toolbar.addAction('view_map',{title:'View map',callback:on_view_map,image_url:img_path+'/sitemap.png',image_size:[16,16]});
	m_view_toolbar.addAction('view_output',{title:'View output',callback:on_view_output,image_url:img_path+'/blue-document-text.png',image_size:[16,16]});	
	
	m_edit_toolbar.setOrientation('vertical');
	m_edit_toolbar.addAction('search',{title:'Search for text',callback:on_search,image_url:img_path+'/document-search-result.png',image_size:[16,16]});
	
	function _initialize() {
		m_mapjs_widget.initialize();
		set_status('Initialized map widget...',1000);
	}
	function update_layout() {
		
		var toolbar_width=24;
		
		var map_width=0;
		var editor_width=0;
		var spacing=0;
		if (m_editor_expand_level==0) {
			map_width=m_width-toolbar_width-5;
			editor_width=0;
			spacing=0;
		}
		else if (m_editor_expand_level==1) {
			editor_width=Math.max(150,Math.min(400,Math.floor(m_width-10)/2));
			map_width=Math.max(0,m_width-10-editor_width-toolbar_width-5);
			spacing=10;
		}
		else if (m_editor_expand_level==2) {
			editor_width=Math.max(150,Math.min(900,Math.floor(m_width-10)*2/3));
			map_width=Math.max(0,m_width-10-editor_width-toolbar_width-5);
			spacing=10;
		}
		else if (m_editor_expand_level==3) {
			editor_width=m_width-toolbar_width-5;
			map_width=0;
			spacing=10;
		}
		
		m_editor.setExpandButtonVisible(m_editor_expand_level<3);
		
		m_div.css({position:'absolute',width:m_width,height:m_height});
		m_mapjs_widget.setSize(map_width,m_height);
		m_mapjs_widget.div().css({left:toolbar_width+5,top:0});
		m_output_window.setSize(map_width,m_height);
		m_output_window.div().css({left:toolbar_width+5,top:0});
		m_editor.setSize(editor_width,m_height);
		m_editor.div().css({left:toolbar_width+5+map_width+spacing,top:0});
		m_status_widget.setSize(map_width||editor_width,12);
		m_status_widget.div().css({left:toolbar_width+5 +4,bottom:0});
		
		var y0=0;
		m_file_toolbar.setIconSize(toolbar_width);
		m_file_toolbar.div().css({left:0,top:y0});
		m_file_toolbar.refresh();
		y0+=m_file_toolbar.height()+24;
		
		m_node_toolbar.setIconSize(toolbar_width);
		m_node_toolbar.div().css({left:0,top:y0});
		m_node_toolbar.refresh();
		y0+=m_node_toolbar.height()+24;
		
		m_view_toolbar.setIconSize(toolbar_width);
		m_view_toolbar.div().css({left:0,top:y0});
		m_view_toolbar.refresh();
		y0+=m_view_toolbar.height()+24;
		
		m_edit_toolbar.setIconSize(toolbar_width);
		m_edit_toolbar.div().css({left:0,top:y0});
		m_edit_toolbar.refresh();
		y0+=m_edit_toolbar.height()+24;
		
		if (editor_width>0) {
			m_div.find('.editorview').show();
		}
		else {
			m_div.find('.editorview').hide();
		}
		
		if (map_width>0) {
			m_div.find('.mapview').show();
			m_mapjs_widget.setInputEnabled(true);
		}
		else {
			m_div.find('.mapview').hide();
			m_mapjs_widget.setInputEnabled(false);
		}
		
		console.log(m_view_mode);
		m_mapjs_widget.div().hide();
		m_output_window.div().hide();
		if (m_view_mode=='map') m_mapjs_widget.div().show();
		else if (m_view_mode=='output') m_output_window.div().show();
	}
	
	function on_editor_save() {
		var node_data=m_mapjs_widget.getNodeData(m_editor_node_id);
		if (!node_data) return;
	
		var old_attachment=node_data.attachment||{};
		var content_type=old_attachment.contentType||'text/plain';
		
		set_status('Saving attachment...',0,function() {
			m_mapjs_widget.setNodeAttachment(m_editor_node_id,{
				contentType:content_type,
				content:m_editor.getText()
			});
			set_status('Attachment saved.',3000);
		});
	}
	function on_editor_expand() {
		m_editor_expand_level=Math.min(3,m_editor_expand_level+1);
		update_layout();
	}
	function on_editor_collapse() {
		m_editor_expand_level=Math.max(0,m_editor_expand_level-1);
		update_layout();
	}
	function on_save_map_local() {
		set_status('Saving map to browser storage...',0,function() {
			var map=m_mapjs_widget.getMap();
			localStorage.wisdmmap_last_map=JSON.stringify(map);
			set_status('Map saved to browser storage.',3000);
			set_last_clean_hash();
		});
	}
	function on_save_map_cloud() {
		var map=m_mapjs_widget.getMap();
		var txt=JSON.stringify(map,txt);
		var key_name=map.root.title;
		var req0={service:'temporarycloud',command:'setFile',key:key_name,data:txt};
		set_status('Sending file to temporary cloud: '+key_name+'...');
		$.post('http://'+location.hostname+'/wisdmserver',JSON.stringify(req0),function(tmp1) {
			if (tmp1.success) {
				set_last_clean_hash();
				set_status('File saved to temporary cloud.',4000);
				if (key_name!=m_temporary_cloud_file_name) {
					var url=location.href;
					var ind=url.indexOf('?');
					if (ind>=0) url=url.slice(0,ind);
					url+='?tc='+key_name;
					location.href=url;
				}
			}
			else {
				set_status('Problem setting file to temporary cloud: '+tmp1.error,8000);
				jAlert('Problem setting file to temporary cloud: '+tmp1.error);
			}
		});
	}
	function load_stored_map() {
		set_status('Loading stored map...',0,function() {
			
			try {
				var tmp=localStorage.wisdmmap_last_map||'';
				var map=JSON.parse(tmp);
				m_mapjs_widget.setMap(map);
				set_status('Map loaded from browser storage.',3000);
				set_last_clean_hash();
			}
			catch(err) {
				W1.setMap({root:{title:'New Map'}});
				console.error(err);
				set_status('Error loading stored map.',3000);
			}	
			
		});
		
	}
	
	function _loadTemporaryCloudFile(key) {
		set_status('Loading temporary cloud file... '+key);
		var req0={service:'temporarycloud',command:'getFile',key:key};
		$.post('http://'+location.hostname+'/wisdmserver',JSON.stringify(req0),function(tmp1) {
			if ((tmp1.success)&&(tmp1.data)) {
				set_status('Parsing temporary cloud file: '+key+' (size = '+tmp1.data.length+')');
				var map;
				try {
					console.log(tmp1.data.length);
					console.log(tmp1.data.slice(0,100));
					map=JSON.parse(tmp1.data);
				}
				catch(err) {
					console.error(err);
					set_status('Error parsing map.',8000);
					return;
				}
				m_mapjs_widget.setMap(map);
				set_status('Loaded temporary cloud file: '+key+'.',3000);
				set_last_clean_hash();
				m_temporary_cloud_file_name=key;
			}
			else {
				jAlert('Problem loading temporary cloud file ('+key+'): '+tmp1.error);
			}
		});
	}
	
	function set_last_clean_hash() {
		m_last_clean_hash=md5(JSON.stringify(m_mapjs_widget.getMap())).toString();
	}
	
	function _hasBeenModified() {
		//var tmp1=localStorage.wisdmmap_last_map||'';
		var tmp1=md5(JSON.stringify(m_mapjs_widget.getMap())).toString();
		return (tmp1!=m_last_clean_hash);
	}
	
	function on_map_key_pressed(params) {
		var node_id=params.node_id;
		var event=params.event;
		var key=params.key;
		//if (key=='t') test_retrieve_files();
	}
	
	function on_node_context_menu(params) {
		setTimeout(function() { //do it this way so we get debug info if something goes wrong
			var div=m_mapjs_widget.div();
			m_node_toolbar.clone().popup(params.x+div.offset().left,params.y+div.offset().top,div);
		},10); 
	}
	
	function on_selected_node_changed() {
		setTimeout(function() { //do it this way so we get debug info if something goes wrong
			update_node_toolbar();
		},10);
	}
	
	function update_node_toolbar() {
		var node_id=m_mapjs_widget.getSelectedNodeId();
		var node_data=m_mapjs_widget.getNodeData(node_id);
		m_node_toolbar.hideActions(['cut_node','copy_node','paste_node','push_files','pull_files','create_app','update_server_files']);
		
		if (!node_data) {
			return;
		}
		
		m_node_toolbar.showActions(['cut_node','copy_node','paste_node']);
		
		var suf0=utils.get_file_suffix(node_data.title||'');
		var att0=(node_data.attachment||{}).content||'';
		if (att0.indexOf('SOURCE=')===0) {
			m_node_toolbar.showActions(['push_files','pull_files']);
		}
		if (att0.indexOf('<WISDMSERVER>')===0) {
			m_node_toolbar.showActions(['update_server_files']);
		}
		if (suf0=='html') {
			m_node_toolbar.showActions(['create_app']);
		}
		
		update_layout();
		
	}

	function on_edit_attachment(node_id) {
		var node_data=m_mapjs_widget.getNodeData(node_id);
		if (!node_data) return;
		var attachment=node_data.attachment||{};
		var title=node_data.title||'';
		var suf=utils.get_file_suffix(title);
		
		var extra_buttons=[];
		if (suf=='ws') {
			extra_buttons.push({label:'Run',show_on_edit:false,show_on_readonly:true,callback:on_run});
		}
		else if (suf=='html') {
			//extra_buttons.push({label:'Create App',show_on_edit:false,show_on_readonly:true,callback:on_create_app});
			//extra_buttons.push({label:'View App',show_on_edit:false,show_on_readonly:true,callback:on_view_app});
		}
		
		m_editor.setExtraButtons(extra_buttons);
		m_editor.setTitle(title);
		setTimeout(function() {
			m_editor_node_id=node_id;
			m_editor.setLanguage(get_language_from_suffix(suf));
			m_editor.setText(attachment.content||'');
			m_editor.setTitle(title);
			if (m_editor_expand_level===0) {
				m_editor_expand_level=1;
				update_layout();
			}
		},200);
	}	
	
	function on_run() {
		var node_id=m_editor_node_id;
		var node_data=m_mapjs_widget.getNodeData(node_id);
		if (!node_data) return;
		
		var script=(node_data.attachment||{}).content||'';
		
		var dependency_scripts={};
		var output=compile_dependency_scripts(node_id,node_data.title,dependency_scripts);
		if (!output.success) {
			jAlert('Error compiling dependent scripts: '+output.error);
		}
		else {
			console.log ('Submitting script...');
			Wisdm.submitScript({script:script,dependency_scripts:dependency_scripts},function(tmp) {
				if (tmp.success=='true') {
					jAlert(JSON.stringify(tmp.output_messages));
				}
				else {
					jAlert(tmp.error);
				}
			});
		}
	}
	
	function get_language_from_suffix(suf) {
		var language='';
		var cpp_suffixes=['cpp','c','h','hpp','cxx','cc'];
		if (suf=='ws') {
			language='wisdm-script';
		}
		else if (cpp_suffixes.indexOf(suf)>=0) {
			language='c++';
		}
		else if (suf=='wdoc') {
			language='jfm-doc';
		}
		else if (suf=='js') {
			language='javascript';
		}
		else if (suf=='m') {
			language='matlab-script';
		}
		else if (suf=='R') {
			language='r';
		}
		else if (suf=='html') {
			language='htmlmixed';
		}
		else if (suf=='css') {
			language='css';
		}
		return language;
	}
	
	function compile_dependency_scripts(node_id,path,dependency_scripts) {
		var node_data=m_mapjs_widget.getNodeData(node_id);
		if (!node_data) return {success:false,error:'Unable to find node data for: '+node_id};
		
		if (dependency_scripts.length>1000) {
			console.error('More than 1000 dependent scripts... most likely an infinite recursion');
			return {success:false,error:'More than 1000 dependent scripts... most likely infinite recursion'};
		}
		
		var script=(node_data.attachment||{}).content||'';
		dependency_scripts[path]=script;
		
		var parent_path=utils.get_file_path(path);
		var include_paths=parse_include_paths(script);
		for (var i=0; i<include_paths.length; i++) {
			var include_path=include_paths[i];
			var report_include_path=include_path;
			if ((!include_path.indexOf('ROOT:')===0)&&(parent_path)) {
				report_include_path=parent_path+'/'+include_path;
			}
			if (!(report_include_path in dependency_scripts)) {
				var node_id_2=find_node_id_from_path(node_data.parent_node_id,include_path);
				if (!node_id_2) {
					return {success:false,error:'Unable to find file: '+include_path};
				}
				var output=compile_dependency_scripts(node_id_2,report_include_path,dependency_scripts);
				if (!output.success) return output;
			}
		}
		return {success:true};
	}
	function find_anchor_node_id(start_node_id,anchor_name) {
		var start_node_data=m_mapjs_widget.getNodeData(start_node_id);
		if (!start_node_data) return null;
		if (start_node_data.title==anchor_name+':') {
			return start_node_id;
		}
		for (var key in start_node_data.child_ids_by_title) {
			var tmp=find_anchor_node_id(start_node_data.child_ids_by_title[key],anchor_name);
			if (tmp) return tmp;
		}
		return null;
	}
	function find_node_id_from_path(ref_node_id,path) {
		var ind_colon=path.indexOf(':');
		var ind_slash=path.indexOf('/');
		if ((ind_slash<0)||(ind_colon<0)||(ind_colon>ind_slash)) {
			//relative path
			var ref_node_data=m_mapjs_widget.getNodeData(ref_node_id);
			if (ref_node_data) {
				var path1='',path2='';
				if (ind_slash>=0) {
					path1=path.slice(0,ind_slash);
					path2=path.slice(ind_slash+1);
				}
				else {
					path1=path;
					path2='';
				}
				if (path1 in ref_node_data.child_ids_by_title) {
					var tmp_node_id=ref_node_data.child_ids_by_title[path1];
					if (!path2) {
						return tmp_node_id;
					}
					else {
						return find_node_id_from_path(tmp_node_id,path2);
					}
				}
				else return null;
			}
			else return null;
		}
		else {
			var anchor_name=path.slice(0,ind_colon);
			var path2=path.slice(ind_colon+2);
			var anchor_node_id=find_anchor_node_id(m_mapjs_widget.getRootNodeId(),anchor_name);
			if (anchor_node_id) {
				return find_node_id_from_path(anchor_node_id,path2);
			}
			else return null;
		}
	}
	function parse_include_paths(script) {
		var ret=[];
		var lines=script.split('\n');
		for (var i=0; i<lines.length; i++) {
			var line=lines[i];
			if (line.indexOf('include(')===0) {
				var ind1=line.indexOf('(');
				var ind2=line.indexOf(')');
				if ((ind1>0)&&(ind2>ind1)) {
					var path0=line.slice(ind1+1,ind2);
					path0=path0.replace("'",'').replace("'",'');
					path0=path0.replace('"','').replace('"','');
					if (path0.length>0) {
						ret.push(path0);
					}
				}
			}
		}
		return ret;
	}
	
	function style_function(data,style) {
	
		var title=data.title||'';
		var suf=utils.get_file_suffix(title);
		
		if (data.is_root) {
			style.background='#887777';
		}
		else {
			if (suf=='ws') {
				style.background='#EEBBBB';
			}
			else if (suf=='js') {
				style.background='#EEBBBB';
				style.fontSize=5;
			}
			else {
				style.background='#DDEEEE';
			}
		}
	}
	
	function get_map_name() {
		var data=m_mapjs_widget.getNodeData(m_mapjs_widget.getRootNodeId());
		if (!data) return '<undefined>';
		return data.title||'untitled';
	}
	function on_download_map() {
		var map_name=get_map_name();
		var map=m_mapjs_widget.getMap();
		var txt=JSON.stringify(map);
		download_text_file(map_name+'.wmap',txt);
	}
	function download_text_file(filename,text) {
		var max_inbrowser_download_size=1000*1000;
		if (text.length>max_inbrowser_download_size) {
			jAlert('File too large for in-browser download ('+Math.floor(text.length/1000)+' kB)');
			return;
		}
		
		uriContent="data:text/plain,"+encodeURIComponent(text);
		
		var pom=document.createElement('a');
		pom.setAttribute('href',uriContent);
		pom.setAttribute('download',filename);
		pom.click();
	}
	
	function on_upload_map() {
		upload_file({text_mode:true,multiple_files_mode:false},function(tmp) {
			if ((tmp.success)&&(tmp.files.length==1)) {
				var str=tmp.files[0].file_data;
				var map0;
				try {
					map0=JSON.parse(str);
				}
				catch(err) {
					console.error(err);
					return;
				}
				m_mapjs_widget.setMap(map0);
			}
		});
	}
	
	function on_copy_node() {
		var node_id=m_mapjs_widget.getSelectedNodeId();
		var node_data=m_mapjs_widget.getMap(node_id);
		var str=JSON.stringify(node_data);
		localStorage.wisdmmap_clipboard=str;
	}
	function on_cut_node() {
		on_copy_node();
		var node_id=m_mapjs_widget.getSelectedNodeId();
		m_mapjs_widget.removeNode(node_id);
		m_mapjs_widget.refreshMap();
	}
	function on_paste_node() {
		var str,map0;
		try {
			str=localStorage.wisdmmap_clipboard;
			map0=JSON.parse(str);
			
		}
		catch(err) {
			console.error(err);
			return;
		}
		if (str.length>10000) {
			jConfirm('Paste '+str.length+' bytes of data?','Paste data?',function(tmp) {
				if (tmp) do_continue();
			});
		}
		else do_continue();
		function do_continue() {
			var node_id=m_mapjs_widget.getSelectedNodeId();
			if (!node_id) return;
			m_mapjs_widget.addNode(node_id,map0.root);
			m_mapjs_widget.refreshMap();
		}
	}
	
	function on_update_server_files() {
		var node_id=m_mapjs_widget.getSelectedNodeId();
		var tmp0=(m_mapjs_widget.getMap(node_id)||{}).root||{};
		var files={};
		var file_count=0;
		for (var i=0; i<tmp0.children.length; i++) {
			var path0=tmp0.children[i].title;
			var content0=(tmp0.children[i].attachment||{}).content||'';
			if ((path0)&&(content0)) {
				files[path0]=content0;
				file_count++;
			}
		}
		
		
		var req0={service:'serveradmin',command:'update_server_files',files:files};
			jAlert('Updating server files...');
			$.post('http://'+location.hostname+'/wisdmserver',JSON.stringify(req0),function(tmp1) {
				if (tmp1.success) {
					jAlert('updated '+file_count+' files');
				}
				else {
					jAlert('Problem updating server files: '+tmp1.error);
				}
			});
		
		//create_app_files(root,parent_node,node_data.title,function(result) {
	}
	
	function on_create_app() {
		
		var tmp0=m_mapjs_widget.getMap();
		if (!tmp0) return;
		var root=tmp0.root||null;
		if (!root) return;
		
		var node_id=m_mapjs_widget.getSelectedNodeId();
		
		var node_data=m_mapjs_widget.getNodeData(node_id);
		if (!node_data) return;
		var parent_node_id=node_data.parent_node_id;
		var parent_node=(m_mapjs_widget.getMap(parent_node_id)||{}).root;
		if (!parent_node) return;

		jAlert('Creating app files...');
		setTimeout(function() {
			create_app_files(root,parent_node,node_data.title,function(result) {
				if (result.success) {
					
					var file_count=0;
					for (var path in result.files) file_count++;
					
					var app_name=utils.get_file_name_without_suffix(node_data.title);
					var req0={service:'appadmin',command:'create_app',app_name:app_name,files:result.files};
					jAlert('Creating app...');
					$.post('http://'+location.hostname+'/wisdmserver',JSON.stringify(req0),function(tmp1) {
						if (tmp1.success) {
							jAlert('Created app: '+req0.app_name+' with '+file_count+' files');
						}
						else {
							jAlert('Problem creating app: '+tmp1.error);
						}
					});
				}
				else {
					jAlert('Problem creating app.');
					console.error(result.error);
				}
			});
		},10);
	}
	
	
	
	/******************************************************************************************
	*******************************************************************************************
	*******************************************************************************************/
	
	function merge_files_at_node(node_id,files) {
		if (!node_id) return;
		for (var relpath in files) {
			merge_file_at_node(node_id,files[relpath],relpath);
		}
		m_mapjs_widget.refreshMap();
	}
	function merge_file_at_node(node_id,file_content,relpath) {
		var filename=utils.get_file_name(relpath);
		var parpath=utils.get_file_path(relpath);
		var node_id_2=node_id;
		if (parpath) {
			create_folder_at_node(node_id,parpath);
			node_id_2=find_node_id_from_path(node_id,parpath);
		}
		if (!node_id_2) return;
		var node_id_3=find_node_id_from_path(node_id_2,filename);
		var att0={contentType:'text/plain',content:file_content};
		if (!node_id_3) {
			m_mapjs_widget.addNode(node_id_2,{title:filename,attachment:att0});
		}
		else {
			m_mapjs_widget.setNodeAttachment(node_id_3,att0);
		}
	}
	function create_folder_at_node(node_id,relpath) {
		if (!relpath) return;
		var ind=relpath.indexOf('/');
		if (ind>=0) {
			var path1=relpath.slice(0,ind);
			var path2=relpath.slice(ind+1);
			if (!find_node_id_from_path(node_id,path1)) {
				m_mapjs_widget.addNode(node_id,{title:path1,collapsed:true});
			}
			var node_id_2=find_node_id_from_path(node_id,path1);
			if (!node_id_2) return;
			create_folder_at_node(node_id_2,path2);
		}
		else {
			if (!find_node_id_from_path(node_id,relpath)) {
				m_mapjs_widget.addNode(node_id,{title:relpath,collapsed:true});
			}
		}
	}
	
	function on_push_files() {
		on_push_or_pull_files('push');
	}
	function on_pull_files() {
		on_push_or_pull_files('pull');
	}
	function parse_source_definition(txt) {
		var ret={};
		var lines=txt.split('\n');
		for (var i=0; i<lines.length; i++) {
			var line=lines[i];
			var ind=line.indexOf('=');
			if (ind>=0) {
				var val1=line.slice(0,ind).trim();
				var val2=line.slice(ind+1).trim();
				if ((val1)&&(val2)) ret[val1]=val2;
			}
		}
		return ret;
	}
	function on_push_or_pull_files(command) {
		var node_id=m_mapjs_widget.getSelectedNodeId();
		var tmp=m_mapjs_widget.getMap(node_id);
		if (!tmp) return;
		var node=tmp.root||null;
		if (!node) return;
		
		var att0=(node.attachment||{}).content||'';
		if (att0.indexOf('SOURCE=')!==0) return;
		
		var source_params=parse_source_definition(att0);
		source_params.source_type=source_params.SOURCE;
		
		if (command=='push') set_status('Pushing files.');
		else if (command=='pull') set_status('Pulling files.');
		else {
			set_status('Unexpected command: '+command);
			return;
		}
		setTimeout(function() {
			var PP=new PushPull();
			PP.onStatus(set_status);
			PP.setSource(source_params);
			PP.setNode(node);
			if (command=='push') PP.handlePush(the_callback);
			else if (command=='pull') PP.handlePull(the_callback);
			
			function the_callback(tmp2) {
				if (tmp2.success) {
					if (command=='pull') {
						set_status('Finished pulling files. Updating map.');
						setTimeout(function() {
							m_mapjs_widget.replaceNode(node_id,node);
							m_mapjs_widget.refreshMap();
							set_status('Finished pulling files.',3000);
						},10);
					}
					else {
						set_status('Finished pushing files.',3000);
					}
				}
				else {
					set_status('Error pulling files: '+tmp2.error,8000);
				}
			}
		},100);
	}
	
	/******************************************************************************************
	*******************************************************************************************
	*******************************************************************************************/
	
	
	var m_saved_editor_expand_level=1;
	function on_toggle_editor_view() {
		if (m_editor_expand_level===0) {
			m_editor_expand_level=m_saved_editor_expand_level;
		}
		else {
			m_saved_editor_expand_level=m_editor_expand_level;
			m_editor_expand_level=0;
		}
		update_layout();
	}
	function on_view_map() {
		set_view_mode('map');
	}
	function on_view_output() {
		set_view_mode('output');
	}
	function set_view_mode(mode) {
		m_view_mode='';
		update_layout();
		setTimeout(function() {
			m_view_mode=mode;
			update_layout();
		},100);
	}
	
	function on_search() {
		jPrompt('Search map for text:','','Search for text',function(str) {
			if (!str) return;
			var map=m_mapjs_widget.getMap();
			set_view_mode('output');
			m_output_window.clearContent();
			m_output_window.appendContent($('<p>Searching for text: <pre>"'+str+'"</pre> ...</p>'));
			set_status('Searching...');
			setTimeout(function() {
				var results=[];
				do_search({node:map.root||{},text:str,timer:new Date(),results:results},function() {
					set_status('Found '+results.length+' items containing '+str);
					var table0=$('<table></table>');
					for (var i=0; i<results.length; i++) {
						var tr0=$('<tr></tr>');
						tr0.append('<td>'+results[i].file_name+'</td>');
						tr0.append('<td>'+results[i].path+'</td>');
						tr0.append('<td>'+f22(truncate_string(results[i].context||'',120))+'</td>');						
						table0.append(tr0);
					}
					m_output_window.clearContent();
					m_output_window.appendContent(table0);
				});
			},100);
		});
		
		function f22(str) {
			var ret=str;
			ret=replace_all(ret,'<','&lt;');
			ret=replace_all(ret,'>','&gt;');
			return ret;
		}
		function replace_all(str,src,dst) {
			return str.split(src).join(dst);
		}
		
		function truncate_string(str,maxlen) {
			if (str.length<=maxlen) return str;
			else return str.slice(0,maxlen-3)+'...';
		}
		function do_search(params,callback) {
			if (params.results.length>=MAX_NUM_RESULTS) {
				callback();
				return;
			}
			var node=params.node||{};
			var title=node.title||'';
			var text=params.text||'';
			var results=params.results;
			var path=params.path||'';
			var att0=(node.attachment||{}).content||'';
			var ind=-1;
			var done=false;
			while (!done) {
				ind=att0.indexOf(text,ind+1);
				if (ind>=0) {
					results.push({file_name:title,path:path,context:get_context_line(att0,ind)});
				}
				if (results.length>=MAX_NUM_RESULTS) {
					callback();
					return;
				}
				else done=true;
			}
			
			var path1=append_paths(path,truncate_string(node.title,30));
			if (node.title.slice(node.title.length-1)==':') path1=node.title;
			var ccc=node.children||[];
			function search_next_child(ind) {
				if (ind>=ccc.length) {
					if (callback) callback();
				}
				else {
					do_search({node:ccc[ind],text:text,results:results,timer:params.timer||null,path:path1},function() {
						search_next_child(ind+1);
					});
				}
			}
			search_next_child(0);
			
		}
		function get_context_line(str,ind) {
			var i1=ind,i2=ind;
			while ((i1-1>=0)&&(str[i1]!='\n')) i1--;
			while ((i2+1<str.length)&&(str[i2]!='\n')) i2++;
			if (str[i1]=='\n') i1++;
			return str.slice(i1,i2).trim();
		}
		function append_paths(path1,path2) {
			if (!path1) return path2;
			if (!path2) return path1;
			return path1+'/'+path2;
		}
	}
	
	function update_default_status() {
		if (Wisdm.sessionNode) {
			if (Wisdm.currentUser) {
				set_default_status('Connected to node:'+Wisdm.sessionNode+' as '+Wisdm.currentUser);
			}
			else {
				set_default_status('Connected to node:'+Wisdm.sessionNode);
			}
		}
		else {
			set_default_status('Ready.');
		}
		
		setTimeout(update_default_status,2000);
	}
	
	function set_default_status(txt) {
		m_status_widget.setDefaultStatus(txt);
	}
	function set_status(txt,timeout_ms,callback) {
		m_status_widget.setStatus(txt,timeout_ms||0);
		if (callback) {
			setTimeout(callback,10);
		}
	}
}
