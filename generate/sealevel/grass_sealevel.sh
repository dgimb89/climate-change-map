SEALEVEL=$1 # e.g. 2
INPUT_DIR=$2
OUTPUT_DIR=$3

g.region n=90 s=0 w=0 e=30 nsres=0.0025 ewres=0.0025
#g.region n=90 s=-90 w=-180 e=180 nsres=0.0025 ewres=0.0025

echo "Importing..."
MAPS=""
for tile in ${INPUT_DIR}cut*.asc ; do
  outname=elev_`basename $tile .asc`
  MAPS=${outname},${MAPS}
  r.external input=$tile output=$outname -o
done
echo "Mosaicing..."
r.patch --overwrite input=$MAPS output=elev_mosaic
echo "Done."
echo "Flooding..."
r.buffer --overwrite input=elev_mosaic@PERMANENT output=elev_buffer distances=0.2
r.mapcalc --overwrite expression="flooding = ( elev_mosaic@PERMANENT <= ${SEALEVEL} ||| elev_buffer@PERMANENT == 2 ) ? 1 : null()"
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