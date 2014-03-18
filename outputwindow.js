function OutputWindow() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.clearContent=function(html) {m_div.empty();};
	this.appendContent=function(X) {m_div.append(X);};
	
	var m_div=$('<div class=outputwindow></div>');
	m_div.css({position:'absolute'});
	
	function update_layout() {
		m_div.css({width:m_width,height:m_height});
	}
	
	that.appendContent('<p>No output.</p>');
}