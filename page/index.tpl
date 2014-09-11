{%extends file="./layout.tpl"%}

{%block name="content"%}
<div id="main" style="height:400px"></div>
{%script%}
var entry = require('lsdemo:widget/app/entry.js');
entry();
{%/script%}
{%/block%}