function StatusWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.setDefaultStatus=function(default_txt) {m_default_status=default_txt; update_layout();};
	this.setStatus=function(txt,timeout_ms) {_setStatus(txt,timeout_ms);};
	
	var m_div=$('<div class=statuswidget></div>');
	var m_width=0;
	var m_height=0;
	var m_status='';
	var m_default_status='';
	
	function update_layout() {
		m_div.css({position:'absolute',width:m_width,height:m_height});
		m_div.html(m_status||m_default_status);
	}
	var m_global_code='';
	function _setStatus(txt,timeout_ms) {
		var local_code=makeRandomId(5);
		m_global_code=local_code;
		m_status=txt;
		update_layout();
		if (timeout_ms) {
			setTimeout(function() {
				if (m_global_code==local_code) {
					that.setStatus('',0);
				}
			},timeout_ms);
		}
	}
}