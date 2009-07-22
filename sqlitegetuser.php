<?php
$db = new PDO('sqlite:openhuman.sqlite');
echo "<table border='1'>
<tr>
<th>variable name</th>
<th>collada to load</th>
</tr>";
foreach ($db->query('SELECT * from organs') as $row) 
{
	echo "<tr>";
	echo "<td>" . $row['object name'] . "</td>";
	echo "<td>" . $row['collada file'] . "</td>";
	echo "</tr>";
}
echo "</table>";

?>

