function upload_file(params,callback) {
	
	var ret={files:[],success:false};
	var current_num_files=0;
	
	var button;
	if (params.multiple_files_mode)
		button=$('<input type="file" name="files[]" label="Upload" multiple></input>');
	else
		button=$('<input type="file" name="files[]" label="Upload"></input>');
	
	button.change(function(evt) {on_upload(evt);});
	
	//Popup
	var W=600;
	var H=90;
	var label0='Upload files';
	if (!params.multiple_files_mode) label0='Upload file';
	
	var dialog=$('<div id="dialog"></div>');
	var X0=$('<div></div>');
	
	X0.css('position','absolute');
	X0.css('width',W);
	X0.css('height',H);
	//Popup Basic Content
	X0.append('<p><span id="label"></span></p>');
	X0.append('<p><span id="upload_button"></span></p>');
	X0.append('<p id="prog_evol"><progress id="progress" max="100" value="0"></progress><span id="more_button"></span></p>');
	
	X0.find('#label').text(label0);
	X0.find('#upload_button').append(button);
	X0.find('#prog_evol').hide();
	dialog.css('overflow','hidden');
	dialog.append(X0);
	$('body').append(dialog);
	dialog.dialog({width:W+20,
									height:H+60,
									resizable:false,
									modal:true,
									title:label0});
	
	function on_upload(evt) {
		dialog.find('#upload_button').hide();
		dialog.find('#prog_evol').show();
		
		//Wisdm.resetImportFileBytesUploaded();
		
		var files=evt.target.files;
		current_num_files=files.length;
		
		function do_read(ind) {
			if (ind<files.length) {
				read_file(files[ind],function(data0) {
					var file_name=files[ind].fileName||files[ind].name;
					if (!data0) {
						jAlert('Problem reading file: '+file_name);
						dialog.dialog('close');
						ret.success=false;
						callback(ret);
						return;
					}
					
					var file0={file_name:file_name,file_data:data0};
					ret.files.push(file0);
					setTimeout(function() {
						do_read(ind+1);
					},10);
				});
			}
			else {
				dialog.dialog('close');
				ret.success=true;
				callback(ret);
			}
		}
		do_read(0);
	}
	/*
	function on_progress(bytes_uploaded,total_bytes) {
		dialog.find('#progress').val(Math.floor(bytes_uploaded/total_bytes*100));
		var txt0='';
		if (current_num_files>1) {
			txt0+='File '+(current_file_index+1)+'/'+current_num_files+' ';
		}
		txt0+=Math.floor(bytes_uploaded/1000)+' of '+Math.floor(total_bytes/1000)+' KB uploaded...';
		dialog.find('#label').html(txt0);
	}
	*/
	function read_file(file0,callback) {
		var reader=new FileReader();
		reader.onload=function(ee) {
			var data0 = ee.target.result;
			callback(data0);
		};
		if (params.text_mode) reader.readAsText(file0);
		else reader.readAsArrayBuffer(file0);
	}
}