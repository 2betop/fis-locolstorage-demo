<?php
header('Content-Type: application/json');
$DIR = dirname(__FILE__);

$type = 'list';

if (isset($_GET['type'])) {
    $type = $_GET['type'];
}

echo file_get_contents($DIR."/".$type.".json");