require('html_template.txt');

function create_app_files(root,parent_node,node_title,callback) {
	
	var files={}; //by path in the app
	var the_error='';
	if (do_create_app_files('<app>',parent_node,node_title,'index.html')) {
		
		//replace the index.html
		create_index_html(function(tmp05) {
			if (tmp05.success) {
				callback({success:true,files:files});
			}
			else {
				callback({success:false,error:tmp05.error});
			}
		});
		
	}
	else {
		callback({success:false,error:the_error});
	}
	function do_create_app_files(from_title,parent_node,node_title,file_path_in_app) {
		
		if (file_path_in_app in files) {
			return true;
		}
		
		var node=get_subnode_by_path(parent_node,node_title);
		if (!node) {
			the_error='Unable to find file: '+node_title+' required from '+from_title;
			return false;
		}
		var txt=get_file_content(node);
		var path0=utils.get_file_path(file_path_in_app);
		var output=handle_require_paths(node_title,parent_node,txt,path0);
		if (!output) return false;
		txt=output.txt;
		var require_parent_nodes=output.require_parent_nodes;
		var require_node_titles=output.require_node_titles;
		var require_paths_in_app=output.require_paths_in_app;
		
		var num_levels=0;
		for (var i=0; i<file_path_in_app.length; i++) {
			if (file_path_in_app[i]=='/') num_levels++;
		}
		txt=preprocess_file_code(txt,utils.get_file_suffix(file_path_in_app),num_levels);
		files[file_path_in_app]=txt;
		for (var i=0; i<require_paths_in_app.length; i++) {
			if (!do_create_app_files(node_title,require_parent_nodes[i],require_node_titles[i],require_paths_in_app[i])) {
				return false;
			}
		}
		
		var suffixes=['js','html','css'];
		for (var is=0; is<suffixes.length; is++) {
			var suf0=suffixes[is];
			if (get_subnode_by_path(parent_node,node_title+'.'+suf0)) {
				if (!do_create_app_files(from_title,parent_node,node_title+'.'+suf0,file_path_in_app+'.'+suf0)) {
					return false;
				}
			}
		}
		
		return true;
	}
	function preprocess_file_code(code,suf,num_levels) {
		var ret=code;
		
		var resources_str="../../resources";
		if (suf=="css") {
			for (var i=0; i<num_levels-1; i++) resources_str="../"+resources_str;
		}
		
		var debug_before=ret.indexOf("$wisdm"+"pages$/resources");
		ret=replace_all(ret,"$wisdm"+"pages$/resources",resources_str); //old system
		ret=replace_all(ret,"$res"+"ources$",resources_str); //new system
		
		return ret;
	}
	function replace_all(str,find,replace) {
		return str.split(find).join(replace);
	}
	function handle_require_paths(from_title,parent_node,txt,path_in_app) {
		var from_suffix=utils.get_file_suffix(from_title);
		
		var output={
			txt:'',
			require_parent_nodes:[],
			require_node_titles:[],
			require_paths_in_app:[]
		};
		
		var lines=txt.split('\n');
		for (var i=0; i<lines.length; i++) {
			var line=lines[i];
			var new_line=line;
			if (line.indexOf('require(')===0) {
				var ind1=line.indexOf('(');
				var ind2=line.indexOf(')');
				if ((ind1>0)&&(ind2>ind1)) {
					var path0=line.slice(ind1+1,ind2);
					path0=path0.replace("'",'').replace("'",'');
					path0=path0.replace('"','').replace('"','');
					if (path0.length>0) {
						
						if (is_anchored_path(path0)) {
							var node22=find_node_by_anchor_path(utils.get_file_path(path0));
							if (!node22) {
								the_error='Unable to find file: '+path0+' required from '+from_title;
								return null;
							}
							output.require_parent_nodes.push(node22);
							output.require_node_titles.push(utils.get_file_name(path0));
							var path1=anchor_path_to_path_in_app(path0);
							output.require_paths_in_app.push(path1);
						}
						else {
							var node11=get_subnode_by_path(parent_node,utils.get_file_path(path0));
							if (!node11) {
								the_error='Unable to find file: '+path0+' required from '+from_title;
								return null;
							}
							output.require_parent_nodes.push(node11);
							output.require_node_titles.push(utils.get_file_name(path0));
							output.require_paths_in_app.push(append_paths(path_in_app,path0));
						}
						if ((from_suffix=='js')||(from_suffix=='css')||(from_suffix=='ws')) {
							new_line='/*** '+new_line+' ***/';
						}
						else if (from_suffix=='html') {
							new_line='<!--- '+new_line+' --->';
						}
					}
				}
			}
			output.txt+=new_line+'\n';
		}
		return output;
	}
	function append_paths(path1,path2) {
		if (!path1) return path2;
		if (!path2) return path1;
		return path1+'/'+path2;
	}
	function get_subnode_by_path(refnode,path) {
		if (path==='') return refnode;
		var path1,path2;
		var ind=path.indexOf('/');
		if (ind>=0) {
			path1=path.slice(0,ind);
			path2=path.slice(ind+1);
		}
		else {
			path1=path;
			path2='';
		}
		var ccc=refnode.children||[];
		for (var i=0; i<ccc.length; i++) {
			if (ccc[i].title==path1) {
				return get_subnode_by_path(ccc[i],path2);
			}
		}
		return null;
	}
	function find_node_by_anchor_path(path) {
		if (path==='') return null;
		var path1,path2;
		var ind=path.indexOf('/');
		if (ind>=0) {
			path1=path.slice(0,ind);
			path2=path.slice(ind+1);
		}
		else {
			path1=path;
			path2='';
		}
		if (path1.indexOf(':')!=path1.length-1) return null;
		path1=path1.slice(0,path1.length-1);
		var node00=find_anchor_node(root,path1);
		if (!node00) return null;
		return get_subnode_by_path(node00,path2);
	}
	function find_anchor_node(start_node,anchor_name) {
		if (!start_node) return null;
		if (anchor_name==='') return null;
		if ((start_node.title||'')==(anchor_name+':')) return start_node;
		var ccc=(start_node.children||[]);
		for (var i=0; i<ccc.length; i++) {
			var tmp=find_anchor_node(ccc[i],anchor_name);
			if (tmp) return tmp;
		}
		return null;
	}
	function is_anchored_path(path) {
		var ind_colon=path.indexOf(':');
		var ind_slash=path.indexOf('/');
		if (ind_colon<0) return false;
		if (ind_slash<0) return (ind_colon=path.length-1);
		return (ind_colon+1==ind_slash);
	}
	function anchor_path_to_path_in_app(path) {
		var ind_colon=path.indexOf(':');
		if (ind_colon<0) return path;
		return path.slice(0,ind_colon)+'_'+path.slice(ind_colon+1);
	}
		
	function get_file_content(node) {
		if (!node.attachment) return '';
		if (!(node.attachment.content)) return '';
		return node.attachment.content;
	}
	function create_index_html(callback) {
		$.get('html_template.txt',function(html) {
			if (html) {
				files['index.html']=format_index_html(html,files['index.html']);
				callback({success:true});
			}
			else {
				callback({success:false});
			}
		});
	}
	function format_index_html(html,mainhtml) {
		html=html.replace("$date_generated$",(new Date()).toString());
		html=html.replace("$PAGE_SPECIFIC_HEAD$",get_page_specific_head(mainhtml));
		html=html.replace("$resources$","../../resources");
		html=html.replace("$DEPENDENCY_HEADER$",make_dependency_header());
		html=html.replace("$PAGE_SPECIFIC_BODY$",get_page_specific_body(mainhtml));
		html=html.replace("$DEPENDENCY_HTML$",get_dependency_html());
		return html;
	}
	function get_page_specific_head(code) {
		var ret='';
		var lines=code.split('\n');
		var in_head=false;
		for (var i=0; i<lines.length; i++) {
			var line=lines[i];
			if (line.indexOf('===HEAD===')===0) in_head=true;
			else if (line.indexOf("===/HEAD===")===0) in_head=false;
			else {
				if (in_head) ret+=line+'\n';
			}
		}
		return ret;
	}
	function get_page_specific_body(code) {
		var ret='';
		var lines=code.split('\n');
		var in_head=false;
		for (var i=0; i<lines.length; i++) {
			var line=lines[i];
			if (line.indexOf('===HEAD===')===0) in_head=true;
			else if (line.indexOf("===/HEAD===")===0) in_head=false;
			else {
				if (!in_head) {
					if (line.indexOf('require(')!==0) ret+=line+'\n';
				}
			}
		}
		return ret;
		
		
	}
	function make_dependency_header() {
		var ret='';
		for (var path in files) {
			var suf=utils.get_file_suffix(path);
			var checksum0=md5(files[path]).toString().slice(0,8);
			if (suf=="css") {		
				ret+="<link rel=\"stylesheet\" type=\"text/css\" href=\""+path+"?checksum="+checksum0+"\">\n";
			}
			else if (suf=="js") {
				ret+="<script type=\"text/javascript\" src=\""+path+"?checksum="+checksum0+"\"></script>\n";
			}
		}
		return ret;
	}
	function get_dependency_html() {
		var ret='';
		for (var path in files) {
			var suf=utils.get_file_suffix(path);
			if ((path!='index.html')&&(suf=='html')) {
				ret+="<!--- "+path+" --->\n"+files[path]+"\n\n";
			}
		}
		return ret;
	}
	
}