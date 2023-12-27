function injectStyles(rule) {
var darkmode = document.createElement("div");
darkmode.id = "igplus_darkmode";

darkmode.innerHTML = '<style>' + rule + '</style>';

if(!document.getElementById('igplus_darkmode'))
{
   document.body.append(darkmode);   
}

  }

  injectStyles(`:root {
    --text-color: #ffffffe0;
    --link-color: #a9ff9ca8;
    --dark-green:#537546;
    --dark-red:#623f3f;;
    --dark-btn:#2B2B2B;
    --dark-btn-hover:#323232;
    --dark-btn-press:#272727;
    --dark-text-area:#2C2C2C;
    --dark-background:#202020;
    --dark-background2:#1F1F1F;
    --dark-color: #121212;
    --dark-color2: #212121;
    --dark-color3: #575757;
  }
  
  #header,#menu,#page-content,.dialog,#header div,#footer{
    background: var(--dark-background)!important;
  }
  .dialog-head,.staff-profile,.statWrap,td.key-pos,div.sceditor-toolbar,.module-title{
    border-bottom: 1px solid var(--dark-btn-hover);
  }
  #splashRace,#splashPrep,.pic-name{
    background: rgba(0, 0, 0, 0.75);
  }
  .btn,.fReq,div.c-wrap,.five > div:nth-child(1),.changelogFilter,.clog-wrap,#article,div.sceditor-toolbar,.blog-wrap,.post-head,.sbutton,.btn2,.btn2:visited,.statWrap div,.btn:visited,td.key3,.mini-subhead,.news,#balance,#tokens,#back, #forward,.ratingBar,#myDropdown{
    color: var(--text-color);
    background: var(--dark-btn)!important;
    border-top: none!important;
  }
  .btn:hover,.sbutton:hover,.btn2:hover,#balance:hover,#tokens:hover,#back:hover, #forward:hover,.mini-subhead:hover{
    background: var(--dark-btn-hover);
    color: var(--text-color);
    border-top: none!important;
  }
  a,a:visited{
    color: var(--link-color);
  }
  .tabs,.tabs a.active, .tabs a.active:hover, .tabs a.active:visited
{
  background: var(--dark-btn)!important;
  color: var(--text-color);
  border-top: none
}
.tabs a, .tabs a:visited,.rewardContent .topRow,div.bb-quote,.changelogFilter > div,.clog-wrap .post-category {
    background: var(--dark-color3)!important;
    color: var(--text-color);
    border-top: none ;
    border-bottom: none ;
}
input,textarea#commentContent{
    background: var(--dark-text-area)!important;
    border: none!important;
    color: var(--text-color);
}
body,h1,h2,.forumUpperTools > a{
    color: var(--text-color)!important;
}
table.acp th{
    background: var(--dark-background);
    color: var(--text-color);
    border-right: 1px solid var(--dark-btn-hover);
}
table.aRows tr:nth-child(2n),.tflip td:nth-child(2n+1),table.acp tr:nth-child(2n)
{
  background: var(--dark-btn-press);
}
table.hover tbody tr:hover{
    background: var(--dark-btn-hover)!important;
}
table.rowBorders tbody tr,.com-wrap{
    border-bottom: 1px solid var(--dark-btn-hover)!important;
}
#beginner-d1Comments,#driver1,#driver2,#d1StrategyComments,#driver1Strategy,#driver2Strategy{
    color: var(--text-color);
    background: var(--dark-btn)!important; 
}
#driver1,#driver2{
    color: var(--text-color);
    background: var(--dark-btn)!important; 
}
#setupSuggestionHeader > tr > td{
    color: var(--text-color);
    background: var(--dark-btn)!important; 
    border-right: 1px solid var(--dark-btn-hover);
}

.minus, .plus,.igpNum,.bgWhite,.bgGrey,.researchFooter,.researchFooter > th {
    background: var(--dark-btn)!important; 
}
.withSlider{
    background-color: var(--dark-green);  
}
#ts-SS, .ts-SS
{
  background: var(--dark-btn) url(https://static.igpmanager.com/igp/design/image/tyre-ss.png) no-repeat center;
  background-size: auto 75%;
}
#ts-S, .ts-S
{
  background: var(--dark-btn) url(https://static.igpmanager.com/igp/design/image/tyre-s.png) no-repeat center;
  background-size: auto 75%;
}
#ts-M, .ts-M
{
  background: var(--dark-btn) url(https://static.igpmanager.com/igp/design/image/tyre-m.png) no-repeat center;
    background-size: auto;
  background-size: auto 75%;
}
#ts-H, .ts-H
{
  background: var(--dark-btn) url(https://static.igpmanager.com/igp/design/image/tyre-h.png) no-repeat center;
    background-size: auto;
  background-size: auto 75%;
}
#ts-I, .ts-I
{
  background: var(--dark-btn) url(https://static.igpmanager.com/igp/design/image/tyre-i.png) no-repeat center;
    background-size: auto;
  background-size: auto 75%;
}
#ts-W, .ts-W
{
  background: var(--dark-btn) url(https://static.igpmanager.com/igp/design/image/tyre-w.png) no-repeat center;
    background-size: auto;
  background-size: auto 75%;
}
#strategy > div:nth-child(1) > div:nth-child(3){
    color: var(--text-color);
    background: var(--dark-btn)!important; 
}
select,.darknotice,.notice,.sceditor-container, textarea,.post-wrap,.sceditor-container iframe{
    background: var(--dark-btn-hover);
    color: var(--text-color)!important;
    border: none;
}
body > p:nth-child(1){
    color: var(--text-color)!important;
}
div.greyWrap,.dropdown2-content,.mailWrap{
    background: var(--dark-background2)!important;
}
.pushBox,h1 a,h1 a:visited{
    color: var(--text-color);
}
.feLabel,.researchImg,div.bb-quote-author{
    filter: invert(1);
}
.bgLightGreen,.block-green,table.acp tr.myTeam
{
    background: var(--dark-green)!important;
}
.bgLightRed,.block-red
{
  background: var(--dark-red)!important;
}
.researchSuggestion{
    background: #5D8C9BBD; 
}
.dialog-foot{
    border-top: 1px solid var(--dark-btn-hover);
}
.singleReward .rewardContent{
    border: 1px solid var(--dark-btn);
    background: var(--dark-btn-press)!important;
}
`)