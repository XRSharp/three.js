import {
	Vector2
} from 'three';


/**
 * Triangle blur shader
 * based on glfx.js triangle blur shader
 * https://github.com/evanw/glfx.js
 *
 * A basic blur filter, which convolves the image with a
 * pyramid filter. The pyramid filter is separable and is applied as two
 * perpendicular triangle filters.
 */

const TriangleBlurShader = {

	name: 'TriangleBlurShader',

	uniforms: {

		'tDiffuse': { value: null },
		'sigma': { value: 4.0 },
		'expectedMin': { value: 0.0 },
		'expectedMax': { value: 0.8 },
		'delta': { value: new Vector2(0.002, 0.002) }

	},

	vertexShader: /* glsl */`

		precision highp float; 

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		precision highp float; // Ensure high precision for calculations

		#include <common>

		#define ITERATIONS 10.0
		#define FACTOR_BETWEEN_DARK_AND_BRIGHT 600.0

		uniform sampler2D tDiffuse;
		uniform vec2 delta; // sampling radius
		uniform float sigma;
		uniform float expectedMin;
		uniform float expectedMax;

		varying vec2 vUv;

		float gaussian(float x, float sigma) {
            return exp(-0.5 * (x * x) / (sigma * sigma)) / (sigma * sqrt(2.0 * 3.14159265));
        }

		bool isInfluencingCurrentSample(float sampleDistance, float sampleDepth) {
            return sampleDepth >= sampleDistance * 40.0  && sampleDepth < 0.9999; // Because more than 0.99 means no object
        }

		float random(float seed) {
			// Constants are chosen to provide a good distribution of pseudo-random values
			float a = 12.9898;
			float b = 78.233;
			float c = 43758.5453123;
			float dt= dot(vec2(seed, seed), vec2(a, b));
			float sn = mod(dt, 3.14); // Using 3.14 as an approximation of PI
			return fract(sin(sn) * c);
		}

		float adjustInputDepthToBeZeroToOne(float depth) {
			//return depth;
            return clamp((1.0 / (expectedMax - expectedMin)) * (depth - expectedMin), 0.0, 1.0);
        }

		void main() {

			vec4 inputColor = texture2D(tDiffuse, vUv);

			float color = 0.0;

			float total = 0.0;

			float influenceOfDarkness = (1.0 - color); // 0.0=not influenced, 1.0=very influenced

			float randomX = rand( vUv ) - 0.5;
			float randomY = random( randomX ) - 0.5;

			for (float y = -ITERATIONS; y <= ITERATIONS; y++) {
                for (float x = -ITERATIONS; x <= ITERATIONS; x++) {
					vec2 offset = delta * vec2(x + randomX, y + randomY);
					vec4 sampleColor = texture2D(tDiffuse, vUv + offset);
					float sampleDistance = length(offset);
					float sampleDepth =adjustInputDepthToBeZeroToOne(1.0 - sampleColor.a); // 0.0=near, 1.0=far

					//float weight =  gaussian(sampleDistance, 0.002) * 0.0005 / sampleDepth;// isInfluencingCurrentSample(sampleDistance, sampleDepth) ? 1.0 : 0.0; // sampleDepth > 0.99 ? 0.0 : 1.0; //gaussian(length(offset) * (1.0 + sampleDepth * (influenceOfDarkness * FACTOR_BETWEEN_DARK_AND_BRIGHT)), sigma);
					float weight =  0.0005 * gaussian(sampleDistance, delta.x + 0.01 * sqrt(sampleDepth)) * (1.0 - sqrt(sampleDepth));
					//color += sampleColor * weight;
					color += weight;
					total += 1.0;
                }
            }

			float resultingColor = clamp(color , 0.0, 1.0);

			float adjustedAlpha = resultingColor; //pow(resultingColor.a, 0.7);
			vec4 adjusted = vec4(0.0, 0.0, 0.0, adjustedAlpha);

			//vec4 adjusted = vec4(0.0, 0.0, 0.0, 1.0 - adjustInputDepthToBeZeroToOne(1.0 - inputColor.a));

			gl_FragColor = adjusted;
			

		}`

};

export { TriangleBlurShader };
