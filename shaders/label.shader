 // The 4x4 world view projection matrix.
  float4x4 viewProjection : WorldViewProjection;
 
  sampler texSampler0;
 
  // input parameters for our vertex shader
  struct VertexShaderInput {
    float4 position : POSITION;
    float2 texcoord : TEXCOORD0;
  };
 
  // input parameters for our pixel shader
  // also the output parameters for our vertex shader
  struct PixelShaderInput {
    float4 position : POSITION;
    float2 texcoord : TEXCOORD0;
  };
 
  
  PixelShaderInput vertexShaderFunction(VertexShaderInput input) {
   
    output.position = mul(input.position, viewProjection);
    output.texcoord = input.texcoord;
    return output;
  }
  
  float4 pixelShaderFunction(PixelShaderInput input): COLOR {
    return tex2D(texSampler0, input.texcoord * 5) + float4(0.2, 0.2, 0.0, 1.0);
  }

  // #o3d VertexShaderEntryPoint vertexShaderFunction
  // #o3d PixelShaderEntryPoint pixelShaderFunction
  // #o3d MatrixLoadOrder RowMajor