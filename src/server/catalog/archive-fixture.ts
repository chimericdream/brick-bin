// Test-only: a tiny but valid Rebrickable archive and LDraw ZIPs, built in memory.
import { TINY_PNG, makeZip } from './test-zip';

/** Header plus a couple of rows for each of the 15 files. Matches the real headers (docs/REBRICKABLE_SPIKE.md). */
export const csvFiles = (imageOrigin = 'https://cdn.rebrickable.com'): Record<string, string> => ({
  'themes.csv': 'id,name,parent_id\n1,Technic,\n721,Icons,\n722,"Vehicles, large",721\n',
  'colors.csv':
    'id,name,rgb,is_trans,num_parts,num_sets,y1,y2\n-1,[Unknown],0033B2,False,17,2,2000,2000\n0,Black,05131D,False,1000,500,1957,2026\n15,White,FFFFFF,False,5000,900,1949,2027\n',
  'part_categories.csv': 'id,name\n11,Bricks\n14,Plates\n',
  'parts.csv':
    'part_num,name,part_cat_id,part_material\n3001,Brick 2 x 4,11,Plastic\n3020,"Plate 2 x 4, long",14,Plastic\n3023,Plate 1 x 2,14,Plastic\n',
  'part_relationships.csv': 'rel_type,child_part_num,parent_part_num\nA,3001a,3001\n',
  'elements.csv': 'element_id,part_num,color_id,design_id\n300126,3001,0,3001\n6001234,3023,15,\n',
  'sets.csv': `set_num,name,year,theme_id,num_parts,img_url\n10294-1,Titanic,2021,721,9092,${imageOrigin}/media/sets/10294-1.jpg\n42100-1,"Liebherr R 9800, big",2019,1,4108,\n`,
  'minifigs.csv': `fig_num,name,num_parts,img_url\nfig-000001,Toy Store Employee,4,${imageOrigin}/media/sets/fig-000001.jpg\n`,
  'inventories.csv': 'id,version,set_num\n1,1,10294-1\n2,1,42100-1\n',
  'inventory_parts.csv':
    'inventory_id,part_num,color_id,quantity,is_spare,img_url\n1,3001,0,4,False,\n1,3023,15,2,True,https://cdn.rebrickable.com/media/parts/photos/15/3023.jpg\n2,3020,0,1,False,\n',
  'inventory_minifigs.csv': 'inventory_id,fig_num,quantity\n1,fig-000001,1\n',
  'inventory_sets.csv': 'inventory_id,set_num,quantity\n1,42100-1,1\n',
  'color_mappings.csv':
    'id,ext_system,ext_id,ext_descr,is_export_id,is_import_id\n0,BL,11,"[""Black""]",True,True\n15,BL,1,"[""White""]",True,True\n',
  'part_mappings.csv':
    'part_num,ext_system,ext_id,is_export_id,is_import_id\n3001,BL,3001,True,True\n3023,BL,3023,True,True\n',
  'set_mappings.csv': 'set_num,ext_system,ext_id\n10294-1,BO,912592\n',
});

/** The default archive contents, with cover addresses on Rebrickable's CDN. */
export const CSV_FILES = csvFiles();

export function buildArchive(
  override: Record<string, string | null> = {},
  imageOrigin?: string,
): Promise<Buffer> {
  const entries: Record<string, string> = { ...csvFiles(imageOrigin) };
  for (const [name, content] of Object.entries(override)) {
    if (content === null) delete entries[name];
    else entries[name] = content;
  }
  return makeZip(entries);
}

/** An LDraw ZIP: flat PNGs named by part number. */
export function buildLdrawZip(parts: string[] = ['3001', '3023', '9999zz']): Promise<Buffer> {
  return makeZip(Object.fromEntries(parts.map((p) => [`${p}.png`, TINY_PNG])));
}

export const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
