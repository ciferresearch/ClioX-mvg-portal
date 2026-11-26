FROM chriswch/text-analysis@sha256:7fe0f99c4f471651e2d96c1fd9493a59d8509f61a4bfc43120a39a338c2fe757
USER root
COPY en_core_web_sm-3.8.0-py3-none-any.whl /tmp/en_core_web_sm-3.8.0-py3-none-any.whl
RUN pip install --no-index --no-deps /tmp/en_core_web_sm-3.8.0-py3-none-any.whl && rm /tmp/en_core_web_sm-3.8.0-py3-none-any.whl
COPY punkt_tab.zip stopwords.zip /tmp/nltk/
RUN python -c "import zipfile,pathlib; root=pathlib.Path('/usr/share/nltk_data'); [(zipfile.ZipFile('/tmp/nltk/'+name+'.zip').extractall(root/folder)) for name,folder in [('punkt_tab','tokenizers'),('stopwords','corpora')]]" && rm -r /tmp/nltk
COPY algorithm.py /algorithm/src/implementation/algorithm.py
COPY node_main.py /algorithm/src/main.py
ENV NLTK_DATA=/usr/share/nltk_data PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 TOKENIZERS_PARALLELISM=false
RUN python -c "import spacy,nltk; spacy.load('en_core_web_sm'); nltk.data.find('tokenizers/punkt_tab/english'); nltk.data.find('corpora/stopwords'); print('Offline language resources verified')"
CMD ["python", "/algorithm/src/main.py"]
