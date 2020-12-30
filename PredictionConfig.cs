using System;

namespace ImageClassifier
{
    public class PredictionConfig
    {
        public string Endpoint { get; set; }
        public string Key { get; set; }
        public Guid ProjectId { get; set; }
        public string ModelName { get; set; }
    }
}
