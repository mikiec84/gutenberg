/**
 * WordPress dependencies
 */
import { Placeholder } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { attr, children } = query;

registerBlockType( 'core/image', {
	title: wp.i18n.__( 'Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		url: attr( 'img', 'src' ),
		alt: attr( 'img', 'alt' ),
		caption: children( 'figcaption' ),
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, alt, caption, align } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
						controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
					/>
				</BlockControls>
			)
		);

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			const setMediaURL = ( media ) => setAttributes( { url: media.url } );
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ wp.i18n.__( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ wp.i18n.__( 'Image' ) }
					className="blocks-image">
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ setMediaURL }
						type="image"
						auto-open
					>
						{ wp.i18n.__( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		const focusCaption = ( focusValue ) => setFocus( { editable: 'caption', ...focusValue } );

		// Disable reason: Each block can be selected by clicking on it

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return [
			controls,
			<figure key="image" className="blocks-image">
				<img src={ url } alt={ alt } onClick={ setFocus } />
				{ ( caption && caption.length > 0 ) || !! focus ? (
					<Editable
						tagName="figcaption"
						placeholder={ wp.i18n.__( 'Write caption…' ) }
						value={ caption }
						focus={ focus && focus.editable === 'caption' ? focus : undefined }
						onFocus={ focusCaption }
						onChange={ ( value ) => setAttributes( { caption: value } ) }
						inline
						inlineToolbar
					/>
				) : null }
			</figure>,
		];
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	},

	save( { attributes } ) {
		const { url, alt, caption, align = 'none' } = attributes;
		const img = <img src={ url } alt={ alt } className={ `align${ align }` } />;

		if ( ! caption || ! caption.length ) {
			return img;
		}

		return (
			<figure>
				{ img }
				<figcaption>{ caption }</figcaption>
			</figure>
		);
	},
} );
