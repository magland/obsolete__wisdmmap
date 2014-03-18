//this file should be removed
require('pages:/widgets/wisdmfolderbrowser/wisdmfolder.js');

function retrieve_file_tree_from_local_path(path,callback) {
	var F=new WisdmFolder('local',{local_root:path});
	F.getFileTree('',function(tree,tmp1) {
		if (tmp1.success) {
			callback(tree,{success:true});
		}
		else {
			callback(tree,{success:false,error:tmp1.error});
		}
	});
}

function retrieve_files_from_local_path(path,callback) {
	
	var ret={};
	
	var F=new WisdmFolder('local',{local_root:path});
	
	var has_error=false;
	
	var num_pending_gets=0;
	num_pending_gets++;
	F.getFileTree('',function(tree,tmp1) {
		num_pending_gets--;
		if (tmp1.success) {
			for (var path in tree) {
				(function(path) {
					num_pending_gets++;
					F.getFileText(path,function(txt,tmp2) {
						if (has_error) return;
						if (tmp2.success) {
							num_pending_gets--;
							ret[path]=txt;
						}
						else {
							has_error=true;
							callback({},{success:false,error:tmp2.error});
							return;
						}
					});
				})(path);
			}
		}
		else {
			has_error=true;
			callback({},{success:false,error:tmp1.error});
			return;
		}
	});
	
	function check_finished() {
		if (has_error) return;
		if (num_pending_gets===0) {
			callback(ret,{success:true});
		}
		else {
			setTimeout(check_finished,100);
		}
	}
	check_finished();
	
	
}
