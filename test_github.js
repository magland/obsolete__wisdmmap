require('pages:/3rdparty/github/github.js');
require('pages:/3rdparty/github/underscore.js');

function retrieve_files_from_github_repository(params,callback) {
	
	var github = new Github({
		username:'magland',
		password:'******',
		auth: "basic"
	});
	var repo0=github.getRepo(params.user,params.repository);
	
	repo0.getTree('master?recursive=true', function(err, tree) {
		if (!err) {
			console.log(tree);
		}
		else {
			console.error(err);
		}
	});
	
		
	return;
	
	
	var params2=$.extend({},params,{path:params.path||'',recursive:true});
	get_file_list(params2,function(err,file_list) {
		if (!err) {
			console.log(file_list);
			/*var ret={};
			var pending_gets='';
			for (var path in file_list) {
				(function do_get(path) {
					pending_gets++;
					$.get(file_list[path].url,function(tmp) {
						pending_gets--;
						console.log('downloaded: '+path,tmp.content.length);
						ret[path]=atob(tmp.content);
					});
				})(path);
			}
			function check_complete() {
				if (pending_gets<=0) {
					callback(ret);
				}
				else {
					setTimeout(check_complete,100);
				}
			}
			check_complete();*/
		}
		else {
			console.error(err);
		}
	});
	
	function get_file_list(params,callback) {
		var ret={};
		var error=null;
		//var url='https://api.github.com/repos/'+params.user+'/'+params.repository+'/contents/'+params.path;
		//$.get(url,function(list) {
		var pending_gets=0;
		var branch='master';
		pending_gets++;
		repo0.contents(branch, params.path, function(err,list) {
			if (!err) {
				try {
					list=JSON.parse(list);
				}
				catch(err5) {
					console.error('Error parsing json: '+err5);
					return;
				}
				pending_gets--;
				
				for (var i=0; i<list.length; i++) {
					var item=list[i];
					if (item.type=='file') {
						ret[params.path+'/'+item.name]=item;
					}
					else if ((item.type=='dir')&&(params.recursive)) {
						var path2=params.path+'/'+item.name;
						if (params.path==='') path2=item.name;
						var params2=$.extend({},params,{path:path2});
						pending_gets++;
						get_file_list(params2,function(err2,tmp_ret) {
							if (!err2) {
								pending_gets--;
								for (var key in tmp_ret) {
									ret[key]=tmp_ret[key];
								}
							}
							else error=err2;
						});
					}
				}
			}
			else error=err;
			
		}, false);
			
		function check_complete() {
			if (pending_gets<=0) {
				callback(null,ret);
			}
			else {
				if (error) {
					callback(error,{});
				}
				else {
					setTimeout(check_complete,100);
				}
			}
		}
		check_complete();
	}
	
	
	/*
	repo0.show(function(err, repo) {
		console.log(err);
		console.log(repo);
		
		var branch='master';
		repo0.contents(branch, "", function(err, contents) {
			console.log(err);
			console.log(contents);
			if (callback) callback(contents);
		}, false);
	});
	*/
	
}