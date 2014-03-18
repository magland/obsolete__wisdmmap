require('wisdmwidgets1:/wisdmcodeeditor/wisdmcodeeditor.js');

function WisdmMapEditor() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.setText=function(text) {m_editor.setText(text); m_last_set_text=text;};
	this.getText=function() {return m_editor.getText();};
	this.onSave=function(callback) {m_div.bind('on-save',function(evt) {callback();});};
	this.setTitle=function(title) {m_title=title; update_layout();};
	this.setExtraButtons=function(extra_buttons) {_setExtraButtons(extra_buttons);};
	this.setLanguage=function(language) {_setLanguage(language);};
	this.onExpand=function(callback) {m_div.bind('on-expand',function() {callback();});};
	this.onCollapse=function(callback) {m_div.bind('on-collapse',function() {callback();});};
	this.setExpandButtonVisible=function(val) {if (val) m_div.find('#expand_button').show(); else m_div.find('#expand_button').hide();};
	this.setCollapseButtonVisible=function(val) {if (val) m_div.find('#collapse_button').show(); else m_div.find('#collapse_button').hide();};
	
	var m_title='';
	var m_div=templateHtml('.wisdmmapeditor');
	var m_width=0;
	var m_height=0;
	var m_language='';
	var m_editor=null;
	var m_edit_mode=false;
	var m_last_set_text='';
	m_div.find('#edit').click(on_edit);
	m_div.find('#save').click(on_save);
	m_div.find('#cancel').click(on_cancel);
	m_div.find('#expand_button').click(function() {m_div.trigger('on-expand');});
	m_div.find('#collapse_button').click(function() {m_div.trigger('on-collapse');});
	
	that.setExpandButtonVisible(false);
	that.setCollapseButtonVisible(false);
	
	var img_path='http://'+location.hostname+'/dev/resources/images/yusukekamiyamane';
	m_div.find('#expand_button').css({"background-image":"url("+img_path+'/arrow-180.png'+")"});
	m_div.find('#collapse_button').css({"background-image":"url("+img_path+'/arrow.png'+")"});
	
	initialize_editor();
	
	function _setLanguage(language) {
		if (m_language==language) return;
		m_language=language;
		initialize_editor();
		update_layout();
	}
	
	function initialize_editor(language) {
		m_editor=new WisdmCodeEditor();
		console.log('setting language: '+m_language);
		m_editor.setLanguage(m_language);
		m_editor.setReadOnly(true);
		m_div.find('#editor_holder').empty();
		m_div.find('#editor_holder').append(m_editor.div());
		m_editor.div().addClass('wisdmmapeditor_editor');
		
		m_editor.onKeyPress(on_editor_key_press);
		
	}
	
	function on_editor_key_press(event) {
		if (event.ctrlKey) {
			if (String.fromCharCode(event.which)=='S') {
				if (m_edit_mode) on_save();
				else return;
			}
			else if (String.fromCharCode(event.which)=='E') {
				if (!m_edit_mode) on_edit();
				else return;
			}
			else return;
		}
		else return;
		event.preventDefault();
		return false;
	}
	
	function update_layout() {
		m_div.css({position:'absolute',width:m_width,height:m_height});
		var button_height=20;
		m_div.find('.menu').css({left:3,right:3,top:0,height:button_height});
		m_editor.setSize(m_width-2,m_height-button_height);
		m_editor.div().css({left:0,top:button_height,bottom:0});
		
		m_div.find('.title').html(m_title);
		m_div.find('button').hide();
		if (m_edit_mode) {
			if (m_title) m_div.find('button.show_on_edit').show();
			m_editor.setReadOnly(false);
		}
		else {
			m_div.find('button.show_on_readonly').show();
			m_editor.setReadOnly(true);
		}
	}
	function on_edit() {
		m_edit_mode=true;
		update_layout();
	}
	function on_save() {
		m_div.trigger('on-save');
		m_edit_mode=false;
		update_layout();
	}	
	function on_cancel() {
		that.setText(m_last_set_text);
		m_edit_mode=false;
		update_layout();
	}
	function _setExtraButtons(extra_buttons) {
		var XX=m_div.find('#extra_buttons');
		XX.empty();
		for (var i=0; i<extra_buttons.length; i++) {
			var BB=extra_buttons[i];
			var BB0=$('<button>'+BB.label+'</button>');
			if (BB.show_on_edit) BB0.addClass('show_on_edit');
			if (BB.show_on_readonly) BB0.addClass('show_on_readonly');
			BB0.click(BB.callback);
			XX.append(BB0);
		}
		update_layout();
	}
}
