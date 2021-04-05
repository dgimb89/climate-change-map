SEALEVEL=$1 # e.g. 2
OUTPUT_DIR=$2

#g.region n=60 s=0 w=0 e=30 nsres=0.0025 ewres=0.0025
g.region n=60 s=-60 w=-180 e=180 nsres=0.005 ewres=0.005

echo "SLR: ${SEALEVEL}"
echo "Flooding..."
r.mapcalc --overwrite expression="flooding = ( elev_mosaic@PERMANENT <= ${SEALEVEL} &&& !isnull(lake@PERMANENT) ||| elev_buffer@PERMANENT == 2 ) ? 1 : null()"
echo "Vectorizing..."
r.to.vect --overwrite input=flooding@PERMANENT output=flooding_vec type=area
echo "Cleaning..."
v.clean --overwrite input=flooding_vec@PERMANENT output=flooding_cleaned tool=rmarea threshold=0.0001
echo "Simplifying..."
v.generalize --overwrite input=flooding_cleaned@PERMANENT type=area output=flooding_gen0 method=reduction threshold=0.001
v.generalize --overwrite input=flooding_gen0@PERMANENT type=area output=flooding_gen1 method=reduction threshold=0.01
echo "Exporting..."
v.out.ogr -s --overwrite input=flooding_gen1@PERMANENT output=${OUTPUT_DIR}/sealevel_${SEALEVEL}.geojson format=GeoJSON lco=COORDINATE_PRECISION=3
echo "Done."

# tippecanoe -zg -o sealevel.mbtiles --drop-densest-as-needed ./sealevel_{-100,1,2}.geojson