/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Keyword Highlight.
 *
 * The Initial Developer of the Original Code is
 * genta_hgr
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

var kh_optdata = {	// temporary data area for option dialog
   data : null,
   init_count : 0,
   count: 0,
};

function kh_template()
{
	this.color_fg = "black";
	this.color_bg = "white";
	this.bold = false;
	this.underline = false;
	this.fontscale = 100;
	this.words = "";
}

//	Initializer
function init() {
	kh_optdata.data = new Array();
	PrefRead ( kh_optdata, "keywordhighlight" );
	create_radio( kh_optdata.data.length );
	update_all_sample( kh_optdata );
	document.getElementById( "setlist" ).selectedIndex = 0;
	SetToDialog( kh_optdata, 0 );
}

function change_edit_page() {
	SetToDialog( kh_optdata, getCurrentSet());
}

function restoreData () {
	// ensure current string is stored to property area
	update_words();
	PrefWrite( kh_optdata, "keywordhighlight" );
	return true;
}


//	Current target
//	return index of selected item
function getCurrentSet() {
	return document.getElementById( "setlist" ).selectedIndex;
}

//	Read preferences and build internal data array
function PrefRead ( obj, base_prefix ) {
  // read the number of preferences
  var count = nsPreferences.getIntPref( base_prefix + ".items", 0);
  obj.init_count = count;

	//alert( "count = " + count );

  // create the first default configuration
  if( count <= 0 ){
    obj.data.push( new kh_template());
  }
  else {
    var itemprefix = base_prefix + ".item.";
    for( var i = 0; i < count; i++ ){
      obj.data[i] = new kh_template();
      obj.data[i].color_fg = nsPreferences.copyUnicharPref( itemprefix + i + ".color_fg", "black" );
      obj.data[i].color_bg = nsPreferences.copyUnicharPref( itemprefix + i + ".color_bg", "white" );
      obj.data[i].bold	  = nsPreferences.getBoolPref( itemprefix + i + ".bold", false );
      obj.data[i].underline = nsPreferences.getBoolPref( itemprefix + i + ".underline", false );
      obj.data[i].fontscale = adjust_scale_range( nsPreferences.getIntPref( itemprefix + i + ".fontscale", 100 ));
      obj.data[i].words = nsPreferences.copyUnicharPref( itemprefix + i + ".words", "" );
      //alert( "i = " + i + " fg = " + obj.data[i].color_fg + " bg = " + obj.data[i].color_bg );
    }
  }
}

function create_radio ( n ) {
	if( n <= 1 ){
		return;
	}
	var list = document.getElementById( "setlist" );
	var cnt = list.getRowCount()
	var label_str = list.getItemAtIndex( 0 ).label;	// copy from the first item
	for( var i = cnt; i < n; i++ ){
		var item = list.appendItem( label_str, i )
	}
}

function add_new_set () {
	kh_optdata.data.push( new kh_template() );
	var index = kh_optdata.data.length - 1;

	// add last page
	var list = document.getElementById( "setlist" );
	var label_str = list.getItemAtIndex( 0 ).label;	// copy from the first item
	var newitem = list.appendItem( label_str, index );
	update_sample( kh_optdata, index );
	list.selectItem( newitem );
	list.ensureElementIsVisible( newitem );
}

//	Write back internal data to preference
function PrefWrite ( obj, base_prefix ) {
	var count = obj.data.length;
	var index = 0;
	var itemprefix = base_prefix + ".item.";
	for( var i = 0; i < count; i++ ){
		var words = obj.data[i].words.split( /\s+/ );
		if( words[ words.length - 1 ] == "" ){
			words.pop();
		}
		if( words.length > 0 && words[0] == ""  ){
			words.shift();
		}
		//alert( "#" + i + " as index = "  + index + " : words# = " + words.length );
		if( words.length > 0 ){
			//	write data only when string is set
			nsPreferences.setUnicharPref( itemprefix + index + ".color_fg", obj.data[i].color_fg );
			nsPreferences.setUnicharPref( itemprefix + index + ".color_bg", obj.data[i].color_bg );
			nsPreferences.setBoolPref( itemprefix + index + ".bold", obj.data[i].bold );
			nsPreferences.setBoolPref( itemprefix + index + ".underline", obj.data[i].underline );
			nsPreferences.setIntPref( itemprefix + index + ".fontscale", obj.data[i].fontscale );
			nsPreferences.setUnicharPref( itemprefix + index + ".words", words.join( " " ) );
			index = index + 1;
		}
	}
	nsPreferences.setIntPref( base_prefix + ".items", index );
}

//	Set text to dialog box
//
function SetToDialog ( obj, page ) {
	document.getElementById( "keywordlist" ).value = obj.data[page].words;
	document.getElementById( "set_foreground" ).color = obj.data[page].color_fg;
	document.getElementById( "set_background" ).color = obj.data[page].color_bg;
	document.getElementById( "set_bold" ).checked = obj.data[page].bold;
	document.getElementById( "set_underline" ).checked = obj.data[page].underline;
	document.getElementById( "set_fontscale" ).value = obj.data[page].fontscale;
	get_scale_after_validity_check();	// update alert string
}

function update_sample( obj, page ){
	var list = document.getElementById( "setlist" );
	var item = list.getItemAtIndex( page );
	
	var data = obj.data[ page ];
	item.style.color = data.color_fg;
	item.style.backgroundColor = data.color_bg;
	if( data.bold ){
		item.style.fontWeight = "bold";
	}
	else {
		item.style.fontWeight = "";
	}
	if( data.underline ){
		item.style.textDecoration = "underline";
	}
	else {
		item.style.textDecoration = "";
	}
}

function update_all_sample( obj ) {
	var count = obj.data.length;
	for( var i = 0; i < count; i++ ){
		update_sample( obj, i );
	}
}

function update_bold(){
	var i = getCurrentSet();
	kh_optdata.data[i].bold = document.getElementById( "set_bold" ).checked;
	update_sample( kh_optdata, i );
}

function update_underline(){
	var i = getCurrentSet();
	kh_optdata.data[i].underline = document.getElementById( "set_underline" ).checked;
	update_sample( kh_optdata, i );
}

function update_foreground(){
	var i = getCurrentSet();
	kh_optdata.data[i].color_fg = document.getElementById( "set_foreground" ).color;
	update_sample( kh_optdata, i );
}

function update_background(){
	var i = getCurrentSet();
	kh_optdata.data[i].color_bg = document.getElementById( "set_background" ).color;
	update_sample( kh_optdata, i );
}

function update_words(){
	var i = getCurrentSet();
	kh_optdata.data[i].words = document.getElementById( "keywordlist" ).value;
}

function update_fontscale(){
	var value = get_scale_after_validity_check();
	var i = getCurrentSet();
	if( value >= 0 ){
		kh_optdata.data[i].fontscale = value;
	}
}

function adjust_scale_range ( scale ){
	if( scale <= 0 || 300 < scale ){
		return 100;
	}
	return scale;
}

// check validity
function get_scale_after_validity_check () {
	var alerter = document.getElementById( "alert_fontscale" );
	var bundle = document.getElementById( "bundle_optionmsg" );
	var value = document.getElementById( "set_fontscale" ).value;
	var check_pattern=/^\d*$/;
	//	check interger
	if( ! check_pattern.test(value) ){
		alerter.value = bundle.getString("FontScaleIsNotInteger");
	}
	else if( value != "" && ( value <= 0 || 300 < value )){	//	check range
		alerter.value = bundle.getString("FontScaleIsOutOfRange");
	}
	else {
		alerter.value = "";
		return value;
	}
	return -1;
}
