g.region n=60 s=-60 w=-180 e=180 nsres=0.005 ewres=0.005

echo "Buffering..."
r.buffer --overwrite input=elev_mosaic@PERMANENT output=elev_buffer distances=0.2
echo "Zeroing..."
r.mapcalc expression="elev_zeroed = isnull(elev_mosaic@PERMANENT) ? 0 : elev_mosaic@PERMANENT" --overwrite
echo "Laking..."
r.lake --overwrite elevation=elev_zeroed@PERMANENT water_level=20 lake=lake coordinates=-15,0
echo "Done."
