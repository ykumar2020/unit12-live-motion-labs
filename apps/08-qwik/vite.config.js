import {qwikVite} from '@builder.io/qwik/optimizer';
import {labConfig} from '../../scripts/vite-common.mjs';
export default labConfig([qwikVite({csr:true})],5288);
