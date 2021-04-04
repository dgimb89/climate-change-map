INPUT_DIR=$1

#g.region n=60 s=0 w=0 e=30 nsres=0.0025 ewres=0.0025
g.region n=60 s=-60 w=-180 e=180 nsres=0.005 ewres=0.005

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