| Name                                              | Service   | Purpose                                                                         | Type and duration                          |
| ------------------------------------------------- | --------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `vizhub.wordcloud.language[.<namespace>]`         | cliox.org | Stores selected stoplist language for Word Cloud (e.g., english, custom).       | First party local storage, persistent data |
| `vizhub.wordcloud.custom_stoplist[.<namespace>]`  | cliox.org | Stores custom stopwords list for the namespace (JSON array).                    | First party local storage, persistent data |
| `vizhub.wordcloud.stoplist_active[.<namespace>]`  | cliox.org | Stores whether the stoplist filter is enabled.                                  | First party local storage, persistent data |
| `vizhub.wordcloud.whitelist[.<namespace>]`        | cliox.org | Stores custom whitelist terms for the namespace (JSON array).                   | First party local storage, persistent data |
| `vizhub.wordcloud.whitelist_active[.<namespace>]` | cliox.org | Stores whether the whitelist filter is enabled.                                 | First party local storage, persistent data |
| `vizhub.wordcloud.min_frequency[.<namespace>]`    | cliox.org | Stores minimum frequency threshold for displayed words.                         | First party local storage, persistent data |
| `vizhub.wordcloud.max_words[.<namespace>]`        | cliox.org | Stores maximum number of words displayed in the Word Cloud.                     | First party local storage, persistent data |
| `vizhub.wordcloud.options[.<namespace>]`          | cliox.org | Stores UI options for the Word Cloud (e.g., font family, color scheme) in JSON. | First party local storage, persistent data |

| Name                          | Service   | Purpose                                                            | Type and duration                    |
| ----------------------------- | --------- | ------------------------------------------------------------------ | ------------------------------------ |
| `textAnalysis.activeJobId`    | cliox.org | Stores the active job ID selected for Text Analysis visualization. | First party session storage, session |
| `cameroonGazette.activeJobId` | cliox.org | Stores the active job ID selected for Cameroon Gazette view.       | First party session storage, session |

| Name                                       | Service   | Purpose                                                                                                    | Type and duration     |
| ------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------- | --------------------- |
| `portal-clioX-indexed-db.textAnalysises`   | cliox.org | Stores Text Analysis visualization data (job metadata and processed results) for reuse across sessions.    | First party IndexedDB |
| `portal-clioX-indexed-db.cameroonGazettes` | cliox.org | Stores Cameroon Gazette visualization data (job metadata and processed results) for reuse across sessions. | First party IndexedDB |
| `portal-clioX-indexed-db.chatbots`         | cliox.org | Stores Chatbot knowledge derived from compute jobs to support the RAG session (job + knowledge chunks).    | First party IndexedDB |
