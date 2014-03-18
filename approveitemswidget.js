function ApproveItemsWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setItems=function(items) {m_items=items;};
	this.setTitle=function(title) {m_title=title;};
	this.popup=function(callback) {return _popup(callback);};
	
	var m_div=$('<div><span class=approveitemswidget></span></div>');
	var m_title='';
	var m_callback=null;
	var m_items=[];
	
	function _popup(callback) {
		m_callback=callback;
		
		m_div.css({overflow:'auto'});
		var table0=$('<table></table>');
		for (var i=0; i<m_items.length; i++) {
			var item=m_items[i];
			var tr0=$('<tr></tr>');
			if (item.item_type=='header_checkbox') {
				tr0.append('<td><input type=checkbox data-item-index='+i+' /></td><th>'+item.label+'</th>');
				tr0.find('input[type=checkbox]').click(on_header_checkbox_clicked);
			}
			else if (item.item_type=='checkbox') {
				tr0.append('<td><input type=checkbox /></td><td>'+item.label+'</td>');
			}
			if (item.item_type=='header_warning') {
				tr0.append('<td></td><th><span class=warning>'+item.label+'</span></th>');
			}
			else if (item.item_type=='warning') {
				tr0.append('<td></td><td><span class=warning>'+item.label+'</span></td>');
			}
			else if (item.item_type=='message') {
				tr0.append('<td></td><td><span class=message>'+item.label+'</span></td>');
			}
			m_items[i].tmp_tr=tr0;
			table0.append(tr0);
		}
		m_div.find('.approveitemswidget').append(table0);
		
		m_div.dialog({width:500,
			height:300,
			resizable:false,
			modal:true,
			title:m_title,
			buttons: { "Ok": on_ok, "Cancel": on_cancel }
		});
	}
	function on_header_checkbox_clicked() {
		var item_index=Number($(this).attr('data-item-index'));
		setTimeout(function() {
			if (m_items[item_index]) {
				var checked0=m_items[item_index].tmp_tr.find('input[type=checkbox]').is(':checked');
				var done=false;
				for (var j=item_index+1; j<m_items.length; j++) {
					if (!done) {
						if (m_items[j].item_type=='checkbox') {
							var elmt=m_items[j].tmp_tr.find('input[type=checkbox]');
							elmt.prop('checked',checked0);
						}
						else done=true;
					}
				}
			}
		},100); //could be important to wait here to make sure checked status is updated... not sure
	}
	function on_ok() {
		for (var i=0; i<m_items.length; i++) {
			var item=m_items[i];
			if (item.item_type=='checkbox') {
				if (item.tmp_tr.find('input[type=checkbox]').is(':checked')) {
					item.approved=true;
				}
				else {
					item.approved=false;
				}
			}
		}
		m_div.dialog('close');
		if (m_callback) m_callback({success:true});
	}
	function on_cancel() {
		m_div.dialog('close');
		if (m_callback) m_callback({success:false,error:'User cancelled'});
	}
}
