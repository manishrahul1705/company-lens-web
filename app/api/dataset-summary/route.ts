import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const dynamic='force-static';
export async function GET(){
 return Response.json(JSON.parse(await readFile(join(process.cwd(),'public/data/metadata.json'),'utf8')));
}
