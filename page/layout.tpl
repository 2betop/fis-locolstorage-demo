<!doctype html>
{%html lang="en" framework="lsdemo:static/mod/mod-ls.js"%}
    {%head%}
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
        <title>{%$title%}</title>
        {%require name="lsdemo:static/css/style.css"%}
    {%/head%}

    {%body%}
        <div id="wrapper">
            {%widget name="lsdemo:widget/header/header.tpl" navs=$navs%}

            {%block name="beforecontent"%}{%/block%}

            <div id="middle" class="container">
                {%block name="content"%}{%/block%}
            </div>

            {%block name="aftercontent"%}{%/block%}

            {%widget name="lsdemo:widget/footer/footer.tpl"%}
        </div>

    {%/body%}

    {%require name="lsdemo:page/layout.tpl"%}
{%/html%}
