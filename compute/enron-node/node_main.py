"""Run the existing Enron implementation using Ocean Node's numbered inputs."""
import hashlib
import json
import os
from pathlib import Path
import sys
from types import SimpleNamespace

sys.path.insert(0, '/algorithm/src')
# Use the bundled Public Suffix List snapshot, avoiding runtime network fetches.
import tldextract
tldextract.extract = tldextract.TLDExtract(cache_dir=None, suffix_list_urls=())
from implementation.algorithm import Algorithm

root = Path('/data/inputs')
dids = json.loads(os.environ.get('DIDS', '[]'))
if not isinstance(dids, list) or not dids:
    raise RuntimeError('Ocean Node supplied no input slots')
slots = []
proof = []
for index, did in enumerate(dids):
    folder = root / str(index)
    # Support the previous DID-named layout as well as the Node numbered layout.
    if not folder.is_dir() and isinstance(did, str) and Path(did).name == did:
        folder = root / did
    if not folder.is_dir():
        raise RuntimeError(f'Missing input slot {index}')
    files = sorted(p for p in folder.iterdir() if p.is_file())
    if not files:
        raise RuntimeError(f'Input slot {index} is empty')
    slots.append(SimpleNamespace(did=did, input_files=files))
    for file in files:
        proof.append({'slot':index,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
# The existing implementation consumes files.files[*].input_files only.
job_details = SimpleNamespace(files=SimpleNamespace(files=slots))
outputs = Path('/data/outputs')
outputs.mkdir(parents=True, exist_ok=True)
(outputs / 'cliox-input-contract.json').write_text(json.dumps(proof))
print('CLIOX_NODE_INPUTS_READY', json.dumps({'slots':len(slots),'files':len(proof)}), flush=True)
algorithm = Algorithm(job_details)
algorithm.run()
algorithm.save_result(outputs)
summary = json.loads((outputs / 'document_summary.json').read_text())
words = json.loads((outputs / 'wordcloud.json').read_text())
if summary.get('totalDocuments', 0) <= 0 or not words.get('wordCloudData'):
    raise RuntimeError('Algorithm produced incomplete analysis results')
# Propagate exceptions: an incomplete result must not be reported as success.
print('CLIOX_ENRON_ALGORITHM_COMPLETED', flush=True)
