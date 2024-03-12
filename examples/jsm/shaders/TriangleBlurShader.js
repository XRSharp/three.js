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
		uniform vec2 delta;
		uniform float sigma;

		varying vec2 vUv;

		float gaussian(float x, float sigma) {
            return exp(-0.5 * (x * x) / (sigma * sigma)) / (sigma * sqrt(2.0 * 3.14159265));
        }

		void main() {

			vec4 color = vec4( 0.0 );

			float total = 0.0;

			float influenceOfDarkness = (1.0 - color.a); // 0.0=not influenced, 1.0=very influenced

			for (float y = -ITERATIONS; y <= ITERATIONS; y++) {
                for (float x = -ITERATIONS; x <= ITERATIONS; x++) {
					vec2 offset = delta * vec2(x, y);
					vec4 sampleColor = texture2D(tDiffuse, vUv + offset);
					float darkness = sampleColor.a;
					float weight = gaussian(length(offset) * (1.0 + darkness * (influenceOfDarkness * FACTOR_BETWEEN_DARK_AND_BRIGHT)), sigma);
					color += sampleColor * weight;
					total += weight;		
                }
            }

			vec4 resultingColor = color / total;

			float adjustedAlpha = pow(resultingColor.a, 0.7); 
			vec4 adjusted = vec4(0.0, 0.0, 0.0, adjustedAlpha);

			gl_FragColor = adjusted;
			

		}`

};

export { TriangleBlurShader };
