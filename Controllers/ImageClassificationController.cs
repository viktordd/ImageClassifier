using System.Collections.Generic;
using System.Linq;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.CognitiveServices.Vision.CustomVision.Prediction;
using Microsoft.Azure.CognitiveServices.Vision.CustomVision.Prediction.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;


namespace ImageClassifier.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ImageClassificationController : ControllerBase
    {
        private readonly ILogger<ImageClassificationController> _logger;
        private IConfiguration Configuration { get; }


        public ImageClassificationController(ILogger<ImageClassificationController> logger, IConfiguration configuration)
        {
            _logger = logger;
            Configuration = configuration;
        }

        [HttpPost]
        public IEnumerable<PredictionModel> Post(IFormFile file)
        {
            var config = GetPredictionConfig();
            var predictionApi = this.AuthenticatePrediction();
            var result = predictionApi.ClassifyImage(config.ProjectId, config.ModelName, file.OpenReadStream());

            return result.Predictions.Where(p => p.Probability > 0.1);
        }

        private CustomVisionPredictionClient AuthenticatePrediction()
        {
            PredictionConfig config = GetPredictionConfig();
            ApiKeyServiceClientCredentials credentials = new Microsoft.Azure.CognitiveServices.Vision.CustomVision.Prediction.ApiKeyServiceClientCredentials(config.Key);
            CustomVisionPredictionClient predictionApi = new CustomVisionPredictionClient(credentials)
            {
                Endpoint = config.Endpoint
            };
            return predictionApi;
        }

        private PredictionConfig GetPredictionConfig()
        {
            return Configuration.GetSection("Prediction").Get<PredictionConfig>();
        }
    }
}
