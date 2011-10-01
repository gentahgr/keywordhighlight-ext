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

var keywordhighlight_main = {
  messagePane : null,
  _Finder: null,

  _onMsgWndLoad: function(e) {
    dump("Enter: _onMsgWndLoad\n");
    keywordhighlight_main._Finder =
    	Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance().QueryInterface(Components.interfaces.nsIFind);
    keywordhighlight_main._messagePane = document.getElementById('messagepane'); // browser parenting the document
    if( ! keywordhighlight_main._messagePane ){
    	dump("_messagePane is empty.\n" );
    	return;
    }
    //this.strings = document.getElementById("keywordhighlight-strings");
    keywordhighlight_main._messagePane.addEventListener("load", keywordhighlight_main._onMessageLoad, true); // wait for doc to be loaded
  },
  
  _onMessageLoad : function (e) {
    //this._messagePane = document.getElementById('messagepane'); // browser parenting the document
    if( ! keywordhighlight_main._messagePane ){
    	alert("empty _messagePane at _onMessageLoad" );
    	return;
    }
    var messageDocument = keywordhighlight_main._messagePane.contentDocument;
    if( ! messageDocument ){
    	alert( "Invalid messageDocument" );
    	return;
    }
    keywordhighlight_main.do_highlight( messageDocument );
  },

  do_highlight : function ( document )
  {
    if( ! document ){
      alert( "no document" );
    	return;
    }

    if( nsPreferences.getBoolPref("keywordhighlight.disabled", false) ){
      return;
    }

    var prefcounts = nsPreferences.getIntPref("keywordhighlight.items", 0);

    dump( "keywordhighlight.items = " + prefcounts );

    if( prefcounts <= 0 ){
    	return;
    }

    //var ignorequote = nsPreferences.getBoolPref("keywordhighlight.ignorequote", false);
    var itemprefix = "keywordhighlight.item.";

    dump( "Start highlighting 2" );

    for( var i = 0; i < prefcounts; i++ ){
      var terms = nsPreferences.copyUnicharPref( itemprefix + i + ".words", "" ).split(/\s+/);
      if( terms.length <= 0 ){
        continue;
      }
      var highlight_style = color2style(
                               nsPreferences.copyUnicharPref( itemprefix + i + ".color_fg", "black" ),
                               nsPreferences.copyUnicharPref( itemprefix + i + ".color_bg", "yellow" ),
                               nsPreferences.getBoolPref( itemprefix + i + ".bold", false ),
                               nsPreferences.getBoolPref( itemprefix + i + ".underline", false ),
                               nsPreferences.getIntPref( itemprefix + i + ".fontscale", 100 )
      );
      
      keywordhighlight_main.highlightMessage(document, terms, highlight_style, false, false );
    }
  },

  highlightMessage: function(doc, termList, highlight_style, ignoreQuote, removeExistingHighlighting )
  {
	dump( "highlightMessage: " + termList[0] );
  	// remove any existing highlighting
  	if (removeExistingHighlighting){
  	  keywordhighlight_main.removeHighlighting(doc);
  	}

  	// wanted to use selection to extend to the word
  	// and compare with the found range, in order to match
  	// only whole words

  	// Save selection
  	// XXX: Note to self, we may want to break on | and white space here
  	// even though normal quick searches treat white spaces as signficant


  	for (var i = 0; i < termList.length; i++){
  		var hit = keywordhighlight_main.highlight(doc, termList[i], highlight_style, ignoreQuote);
  	}
  },

  removeHighlighting : function (doc)
  {
  	var elem = null;

  	while ((elem = doc.getElementById('composer-highlight-id')))
  	  {
  		  var child = null;
  		  var docfrag = doc.createDocumentFragment();
  		  var next = elem.nextSibling;
  		  var parent = elem.parentNode;
  		  while((child = elem.firstChild)) {
  			  docfrag.appendChild(child);
  		  }

  		  parent.insertBefore(docfrag, next);
  		  parent.removeChild(elem);
  	  }

  	return;
  },

  highlight : function (doc, word, highlight_style, ignoreQuote)
  {
    // ignoreQuote is not implemented so far
  	if (!doc){
  	  return 0;
  	}

  	if (!("body" in doc)){
  	  return 0;
  	}
  	
  	var body = doc.body;
  	var count = body.childNodes.length;
  	var searchRange = doc.createRange();
  	var startPt = doc.createRange();
  	var endPt = doc.createRange();

  	var baseNode = doc.createElement("span");
  	baseNode.setAttribute("style", highlight_style);
  	baseNode.setAttribute("id", "composer-highlight-id");

  	searchRange.setStart(body, 0);
  	searchRange.setEnd(body, count);

  	startPt.setStart(body, 0);
  	startPt.setEnd(body, 0);
  	endPt.setStart(body, count);
  	endPt.setEnd(body, count);
  	
  	var ret = keywordhighlight_main.highlightText(word, baseNode, startPt, endPt, searchRange, ignoreQuote);
  	return ret;
  },
  // search through the message looking for occurrences of word
  // and highlighting them.
  highlightText: function (word, baseNode, startPt, endPt, searchRange, ignoreQuote)
  {
  	var retRange = null;
  	var hit = false;
  	
  	while((retRange = keywordhighlight_main._Finder.Find(word, searchRange, startPt, endPt)))
  	  {
  		  var nodeSurround = baseNode.cloneNode(true);
  		  var node = highlightRange(retRange, nodeSurround);
  		  startPt = node.ownerDocument.createRange();
  		  startPt.setStart(node, node.childNodes.length);
  		  startPt.setEnd(node, node.childNodes.length);
  	  }

  }

};

function highlightRange(range, node)
{
	var startContainer = range.startContainer;
	var startOffset = range.startOffset;
	var endOffset = range.endOffset;
	var docfrag = range.extractContents();
	var before = startContainer.splitText(startOffset);
	var parent = before.parentNode;

	node.appendChild(docfrag);
	parent.insertBefore(node, before);
	return node;
}

function color2style ( color_fg, color_bg, bold, underline, size ){
  var s = "";
  if( color_fg ){
  	s = s + "color: " + color_fg + ";";
  }
  if( color_bg ){
  	s = s + "background-color: " + color_bg + ";";
  }
  if( bold ){
    s = s + "font-weight: bold;";
  }
  if( underline ){
    s = s + "text-decoration: underline;";
  }
  if( size && size != 100 && 0 < size && size <= 300){
    s = s + "font-size: " + size + "%;";
  }

  return s;
}
