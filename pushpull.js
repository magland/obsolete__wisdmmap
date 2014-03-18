require('approveitemswidget.js');
require('wisdmwidgets1:/wisdmfolderbrowser/wisdmfolder.js');

function PushPull() {
	var that=this;
	
	this.setSource=function(source) {m_source=$.extend({},source);};
	this.setNode=function(node) {m_node=node;};
	this.handlePush=function(callback) {return _handlePush(callback);};
	this.handlePull=function(callback) {return _handlePull(callback);};
	this.onStatus=function(callback) {m_status_handlers.push(callback);};
	
	var m_source={source_type:'local',path:''};
	var m_node={};
	var m_local_folder=null;
	var m_remote_folder=null;
	var m_status_handlers=[];
	
	function _handlePush(callback) {
		_handlePushPull({command:'push'},callback);
	}
	function _handlePull(callback) {
		_handlePushPull({command:'pull'},callback);
	}
	function _handlePushPull(Params,callback_handle_pushpull) {
		
		var command=Params.command;
		
		m_local_folder=new WisdmFolder('mapnode',{node:m_node});
		m_remote_folder=new WisdmFolder(m_source.source_type,m_source);
		
		m_local_folder.getFileTree('',function(local_tree,tmp001) {
		m_remote_folder.getFileTree('',function(remote_tree,tmp002) {
			if (!tmp001.success) {
				if (callback_handle_pushpull) callback_handle_pushpull(tmp001);
				return;
			}
			if (!tmp002.success) {
				if (callback_handle_pushpull) callback_handle_pushpull(tmp002);
				return;
			}
			
			var differences=compute_differences(local_tree,remote_tree);
		
			handle_differences(command,differences,function(tmp003) {
				if (tmp003.success) {
					
					if ((m_source.source_type=='git')&&(command=='push')) {
						jPrompt('Commit message (required):','','Commit changes',function(msg) {
							if (msg) {
								m_remote_folder.specialCommand('gitCommitAll',{commit_message:msg},callback_handle_pushpull);
							}
							else {
								callback_handle_pushpull({success:false,error:'Commit canceled by user'});
							}
						});
					}
					else {
						callback_handle_pushpull({success:true});
					}
				}
				else {
					callback_handle_pushpull(tmp003);
				}
			});
			
		});});
	}
	
	function handle_differences(command,differences,callback_handle_differences) {
		
		//collect the proposed changes and warnings
		var proposed_changes=[];
		var warnings=[];
		for (var i=0; i<differences.length; i++) {
			var DD=differences[i];
			if (DD.difference_type=='new_in_local') {
				if (command=='pull') {
					proposed_changes.push({change_type:'delete_local',reason:'new_in_local',path:DD.path});
				}
				else if (command=='push') {
					proposed_changes.push({change_type:'add_remote',reason:'new_in_local',path:DD.path});
				}
			}
			else if (DD.difference_type=='missing_in_remote') {
				if (command=='pull') {
					proposed_changes.push({change_type:'delete_local',reason:'missing_in_remote',path:DD.path});
				}
				else if (command=='push') {
					proposed_changes.push({change_type:'add_remote',reason:'missing_in_remote',path:DD.path});
				}
			}
			else if (DD.difference_type=='change_in_both') {
				if (command=='pull') {
					proposed_changes.push({change_type:'update_local',reason:'change_in_both',path:DD.path});
				}
				else if (command=='push') {
					proposed_changes.push({change_type:'update_remote',reason:'change_in_both',path:DD.path});
				}
			}
			else if (DD.difference_type=='change_in_local') {
				if (command=='pull') {
					proposed_changes.push({change_type:'update_local',reason:'change_in_local',path:DD.path});
				}
				else if (command=='push') {
					proposed_changes.push({change_type:'update_remote',reason:'change_in_local',path:DD.path});
				}
			}
			else if (DD.difference_type=='change_in_remote') {
				if (command=='pull') {
					proposed_changes.push({change_type:'update_local',reason:'change_in_remote',path:DD.path});
				}
				else if (command=='push') {
					proposed_changes.push({change_type:'update_remote',reason:'change_in_remote',path:DD.path});
				}
			}
			else if (DD.difference_type=='missing_in_local') {
				if (command=='pull') {
					proposed_changes.push({change_type:'add_local',reason:'missing_in_local',path:DD.path});
				}
				else if (command=='push') {
					proposed_changes.push({change_type:'delete_remote',reason:'missing_in_local',path:DD.path});
				}
			}
		}				
			
		//collect the items for approval
		
		var all_items=[];
		
		//delete_local
		var delete_local_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='delete_local')&&(PC.reason=='missing_in_remote')) {
				delete_local_list.push(PC);
			}
		}
		if (delete_local_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Delete the following items locally?'});
			for (var j=0; j<delete_local_list.length; j++) {
				var PC=delete_local_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//delete_remote
		var delete_remote_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='delete_remote')&&(PC.reason=='missing_in_local')) {
				delete_remote_list.push(PC);
			}
		}
		if (delete_remote_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Delete the following items remotely?'});
			for (var j=0; j<delete_remote_list.length; j++) {
				var PC=delete_remote_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//update_local
		var update_local_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='update_local')&&(PC.reason=='change_in_remote')) {
				update_local_list.push(PC);
			}
		}
		if (update_local_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Update the following items locally?'});
			for (var j=0; j<update_local_list.length; j++) {
				var PC=update_local_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//update_remote
		var update_remote_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='update_remote')&&(PC.reason=='change_in_local')) {
				update_remote_list.push(PC);
			}
		}
		if (update_remote_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Update the following items remotely?'});
			for (var j=0; j<update_remote_list.length; j++) {
				var PC=update_remote_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//add_local
		var add_local_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if (PC.change_type=='add_local') {
				add_local_list.push(PC);
			}
		}
		if (add_local_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Add the following items locally?'});
			for (var j=0; j<add_local_list.length; j++) {
				var PC=add_local_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//add_remote
		var add_remote_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if (PC.change_type=='add_remote') {
				add_remote_list.push(PC);
			}
		}
		if (add_remote_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Add the following items remotely?'});
			for (var j=0; j<add_remote_list.length; j++) {
				var PC=add_remote_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//update_local_and_overwrite
		var update_local_list2=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='update_local')&&((PC.reason=='change_in_local')||(PC.reason=='change_in_both'))) {
				update_local_list2.push(PC);
			}
		}
		if (update_local_list2.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Overwrite local changes in these files?'});
			for (var j=0; j<update_local_list2.length; j++) {
				var PC=update_local_list2[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//update_remote_and_overwrite
		var update_remote_list2=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='update_remote')&&((PC.reason=='change_in_remote')||(PC.reason=='change_in_both'))) {
				update_remote_list2.push(PC);
			}
		}
		if (update_remote_list2.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Overwrite remote changes in these files?'});
			for (var j=0; j<update_remote_list2.length; j++) {
				var PC=update_remote_list2[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//delete_new_local
		var delete_new_local_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='delete_local')&&(PC.reason=='new_in_local')) {
				delete_new_local_list.push(PC);
			}
		}
		if (delete_new_local_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Delete the following added local items?'});
			for (var j=0; j<delete_new_local_list.length; j++) {
				var PC=delete_new_local_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
		
		//delete_new_remote
		var delete_new_remote_list=[];
		for (var i=0; i<proposed_changes.length; i++) {
			var PC=proposed_changes[i];
			if ((PC.change_type=='delete_remote')&&(PC.reason=='new_in_remote')) {
				delete_new_remote_list.push(PC);
			}
		}
		if (delete_new_remote_list.length>0) {
			all_items.push({item_type:'header_checkbox',label:'Delete the following added remote items?'});
			for (var j=0; j<delete_new_remote_list.length; j++) {
				var PC=delete_new_remote_list[j];
				all_items.push({item_type:'checkbox',label:PC.path+' ('+PC.reason+')',change_type:PC.change_type,path:PC.path});
			}
		}
				
		//warnings
		if (warnings.length>0) {
			all_items.push({item_type:'header_warning',label:'Warnings'});
			for (var j=0; j<warnings.length; j++) {
				var WW=warnings[j];
				all_items.push({item_type:'warning',label:WW.path+' ('+WW.warning_type+')',path:WW.path});
			}
		}
			
		
		//approve the items
		if (all_items.length===0) {
			all_items.push({item_type:'message',label:'No changes.'});
		}
		approve_items(all_items,function(approved_items,tmp8) {
			if (tmp8.success) {
				if (approved_items.length>0) {
					apply_changes(approved_items,function(tmp2) {
						if (callback_handle_differences) callback_handle_differences(tmp2);
					});
				}
			}
			else {
				if (callback_handle_differences) callback_handle_differences({success:false,error:tmp8.error});
			}
		});
	}
	
	/*
	function retrieve_file_tree_from_local_path(path,callback_000) {
		var F=new WisdmFolder('local',{local_root:path});
		F.getFileTree('',function(tree,tmp1) {
			if (tmp1.success) {
				callback_000(tree,{success:true});
			}
			else {
				callback_000(tree,{success:false,error:tmp1.error});
			}
		});
	}
	*/
	
	function approve_items(items,callback_approve_items) {
		var W=new ApproveItemsWidget();
		W.setItems(items);
		W.popup(function(tmp) {
			if (tmp.success) {
				var approved_items=[];
				for (var i=0; i<items.length; i++) {
					if (items[i].approved) approved_items.push(items[i]);
				}
				if (callback_approve_items) callback_approve_items(approved_items,{success:true});
			}
			else {
				if (callback_approve_items) callback_approve_items([],tmp);
			}
		});
	}
	function apply_changes(items,callback_apply_changes) {
		function apply_next_change(index) {
			if (index>=items.length) {
				callback_apply_changes({success:true});
			}
			else {
				do_apply_change(items[index],function(tmp4) {
					if (tmp4.success) {
						apply_next_change(index+1);
					}
					else {
						callback_apply_changes(tmp4);
					}
				});
			}
		}
		apply_next_change(0);
	}
	function do_apply_change(item,callback_do_apply_changes) {
		if ((item.change_type=='add_local')||(item.change_type=='update_local')) {
			set_status('Getting file from remote: '+item.path);
			m_remote_folder.getFileText(item.path,function(txt,tmp20) {
				if (tmp20.success) {
					set_status('Setting file to local: '+item.path);
					m_local_folder.setFileText(item.path,txt,function(tmp30) {	
						if (tmp30.success) {
							m_local_folder.specialCommand('setNodeAttributes',{path:item.path,attributes:{md5_at_last_sync:md5(txt).toString()}});
							set_status('Finished '+item.change_type+': '+item.path);
							callback_do_apply_changes({success:true});
						}
						else {
							set_status(tmp30.error);
							callback_do_apply_changes({success:false,error:tmp30.error});
						}
					});
				}
				else {
					set_status(tmp20.error);
					callback_do_apply_changes({success:false,error:tmp20.error});
				}
			});
		}
		else if ((item.change_type=='add_remote')||(item.change_type=='update_remote')) {
			set_status('Getting file from local: '+item.path);
			m_local_folder.getFileText(item.path,function(txt,tmp20) {
				if (tmp20.success) {
					set_status('Setting file to remote: '+item.path);
					m_remote_folder.setFileText(item.path,txt,function(tmp30) {	
						if (tmp30.success) {
							m_local_folder.specialCommand('setNodeAttributes',{path:item.path,attributes:{md5_at_last_sync:md5(txt).toString()}});
							set_status('Finished '+item.change_type+': '+item.path);
							callback_do_apply_changes({success:true});
						}
						else {
							set_status(tmp30.error);
							callback_do_apply_changes({success:false,error:tmp30.error});
						}
					});
				}
				else {
					set_status(tmp20.error);
					callback_do_apply_changes({success:false,error:tmp20.error});
				}
			});
		}
		else if ((item.change_type=='delete_local')) {
			set_status('Removing file from local: '+item.path);
			m_local_folder.removeFile(item.path,function(tmp40) {	
				if (tmp40.success) {
					set_status('Finished '+item.change_type+': '+item.path);
					callback_do_apply_changes({success:true});
				}
				else {
					set_status(tmp40.error);
					callback_do_apply_changes({success:false,error:tmp40.error});
				}
			});
		}
		else if ((item.change_type=='delete_remote')) {
			set_status('Removing file from remote: '+item.path);
			m_remote_folder.removeFile(item.path,function(tmp40) {	
				if (tmp40.success) {
					set_status('Finished '+item.change_type+': '+item.path);
					callback_do_apply_changes({success:true});
				}
				else {
					set_status(tmp40.error);
					callback_do_apply_changes({success:false,error:tmp40.error});
				}
			});
		}
	}
	
	function append_path(path1,path2) {
		if (!path1) return path2;
		if (!path2) return path1;
		return path1+'/'+path2;
	}
	function get_local_tree(local_tree,node,relpath) {
		var ccc=node.children||[];
		for (var i=0; i<ccc.length; i++) {
			var title=ccc[i].title||'';
			var att0=(ccc[i].attachment||{}).content||'';
			if ((att0.length>0)&&(title)) {
				local_tree[append_path(relpath,title)]={size:att0.length,md5:md5(att0).toString()};
			}
			var ccc2=ccc[i].children||[];
			if ((ccc2.length>0)&&(title)) {
				get_local_tree(local_tree,ccc[i],append_path(relpath,title));
			}
		}
	}
	function compute_differences(local_tree,remote_tree) {
		var ret=[];
		for (var path in local_tree) {
			if (!(path in remote_tree)) {
				if  (!(local_tree[path].md5_at_last_sync)) {
					ret.push({path:path,difference_type:'new_in_local'});
				}
				else {
					ret.push({path:path,difference_type:'missing_in_remote'});
				}
			}
			else {
				if (local_tree[path].md5!=remote_tree[path].md5) {
					var md5_at_last_sync=local_tree[path].md5_at_last_sync||null;
					if (!md5_at_last_sync) {
						ret.push({path:path,difference_type:'change_in_both'});
					}
					else if ((md5_at_last_sync!=local_tree[path].md5)&&(md5_at_last_sync!=remote_tree[path].md5)) {
						ret.push({path:path,difference_type:'change_in_both'});
					}
					else if (md5_at_last_sync!=local_tree[path].md5) {
						ret.push({path:path,difference_type:'change_in_local'});
					}
					else if (md5_at_last_sync!=remote_tree[path].md5) {
						ret.push({path:path,difference_type:'change_in_remote'});
					}
					else {
						console.error('Unexpected problem 99A');
					}
				}
			}
		}
		for (var path in remote_tree) {
			if (!(path in local_tree)) {
				ret.push({path:path,difference_type:'missing_in_local'});
			}
		}
		return ret;
	}
	
	function set_status(txt) {
		for (var i=0; i<m_status_handlers.length; i++) 
			(m_status_handlers[i])(txt);
	}
	
	
}