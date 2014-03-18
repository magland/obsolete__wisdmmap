require('wisdmjs:/wisdm.js');
require('wisdmmapwidget.js');

document.onWisdm=function() {
	initializeWisdmBanner({content:$('#content')});
	do_initialize();
	/*initializeWisdmSession({user:'',node:'central',login:true,manual:true},function(tmp) {
		if (tmp.success) {
		}
		else {
			jAlert(tmp.error);
		}
	});*/
};

function do_initialize() {
	var W1=new WisdmMapWidget();
	$('#content').append(W1.div());
	
	function update_layout() {
		var W0=$('#content').width()-20;
		var H0=$('#content').height()-30;
		W1.setSize(W0,H0);
		W1.div().css({position:'absolute',left:10,top:10});
	}
	update_layout();
	$(window).resize(update_layout);
	
	W1.initialize();
	
	var tc=Wisdm.queryParameter('tc','');
	
	if (tc) {
		W1.loadTemporaryCloudFile(tc);
	}
	else {
		W1.loadStoredMap();
	}
	
	window.onbeforeunload = function(){
		if (W1.hasBeenModified()) {
			return 'Leave without saving map?';
		}
		else return null;
	};
	
}



function test_map() {
	return {
		root:{
			title:'This is a test map',
			children:[
				{title:'child1',negative:true},
				{title:'child2',attachment:{contentType:"text/html",content:"content <b>bold content</b>"}},
				{title:'child3',children:[
					{title:'grandchild1'},
					{title:'grandchild2'},
					{title:'grandchild3'}
				]}
			]
		}
	};
}
