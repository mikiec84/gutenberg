/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { throttle, reduce } from 'lodash';

/**
 * Internal dependencies
 */
import VisualEditorBlock from './block';
import {
	getBlockUids,
	getBlockInsertionPoint,
	getBlockSelectionStart,
	getBlockSelectionEnd,
} from '../../selectors';

const INSERTION_POINT_PLACEHOLDER = '[[insertion-point]]';

class VisualEditorBlockList extends wp.element.Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );
		this.onPointerMove = throttle( this.onPointerMove.bind( this ), 250 );
		// Browser does not fire `*move` event when the pointer position changes
		// relative to the document, so fire it with the last known position.
		this.onScroll = () => this.onPointerMove( { clientY: this.lastClientY } );
		this.setBlockRef = this.setBlockRef.bind( this );

		this.state = {
			selectionAtStart: null,
		};

		this.coordMap = {};
		this.coordMapKeys = [];
		this.lastClientY = 0;
		this.refs = {};
	}

	componentWillUnmount() {
		// Cancel throttled calls.
		this.onPointerMove.cancel();
	}

	setBlockRef( ref, uid ) {
		if ( ref === null ) {
			delete this.refs[ uid ];
		} else {
			this.refs = {
				...this.refs,
				[ uid ]: ref,
			};
		}
	}

	onPointerMove( { clientY } ) {
		const y = clientY + window.pageYOffset;
		const key = this.coordMapKeys.reduce( ( acc, topY ) => y > topY ? topY : acc );

		this.lastClientY = clientY;
		this.onSelectionChange( this.coordMap[ key ] );
	}

	onSelectionStart( uid ) {
		const { pageYOffset } = window;

		// Create a Y coödinate map to unique block IDs.
		this.coordMap = reduce( this.refs, ( acc, node, blockUid ) => ( {
			...acc,
			[ pageYOffset + node.getBoundingClientRect().top ]: blockUid,
		} ), {} );
		// Cache an array of the Y coödrinates for use in `onPointerMove`.
		this.coordMapKeys = Object.keys( this.coordMap );
		this.setState( { selectionAtStart: uid } );

		window.addEventListener( 'mousemove', this.onPointerMove );
		window.addEventListener( 'touchmove', this.onPointerMove );
		window.addEventListener( 'scroll', this.onScroll );
		window.addEventListener( 'mouseup', this.onSelectionEnd );
		window.addEventListener( 'touchend', this.onSelectionEnd );
	}

	onSelectionChange( uid ) {
		const { onMultiSelect, selectionStart, selectionEnd } = this.props;
		const { selectionAtStart } = this.state;
		const isAtStart = selectionAtStart === uid;

		if ( ! selectionAtStart ) {
			return;
		}

		if ( isAtStart && selectionStart ) {
			onMultiSelect( { start: null, end: null } );
		}

		if ( ! isAtStart && selectionEnd !== uid ) {
			onMultiSelect( { start: selectionAtStart, end: uid } );
		}
	}

	onSelectionEnd() {
		this.setState( { selectionAtStart: null } );

		window.removeEventListener( 'mousemove', this.onPointerMove );
		window.removeEventListener( 'touchmove', this.onPointerMove );
		window.removeEventListener( 'scroll', this.onScroll );
		window.removeEventListener( 'mouseup', this.onSelectionEnd );
		window.removeEventListener( 'touchend', this.onSelectionEnd );
	}

	render() {
		const { blocks, insertionPoint } = this.props;
		const insertionPointIndex = blocks.indexOf( insertionPoint );
		const blocksWithInsertionPoint = insertionPoint
			? [
				...blocks.slice( 0, insertionPointIndex + 1 ),
				INSERTION_POINT_PLACEHOLDER,
				...blocks.slice( insertionPointIndex + 1 ),
			]
			: blocks;

		return (
			<div>
				{ blocksWithInsertionPoint.map( ( uid ) => {
					if ( uid === INSERTION_POINT_PLACEHOLDER ) {
						return (
							<div
								key={ INSERTION_POINT_PLACEHOLDER }
								className="editor-visual-editor__insertion-point"
							/>
						);
					}

					return (
						<VisualEditorBlock
							key={ uid }
							uid={ uid }
							blockRef={ ( ref ) => this.setBlockRef( ref, uid ) }
							onSelectionStart={ () => this.onSelectionStart( uid ) }
						/>
					);
				} ) }
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
		insertionPoint: getBlockInsertionPoint( state ),
		selectionStart: getBlockSelectionStart( state ),
		selectionEnd: getBlockSelectionEnd( state ),
	} ),
	( dispatch ) => ( {
		onMultiSelect( { start, end } ) {
			dispatch( { type: 'MULTI_SELECT', start, end } );
		},
	} )
)( VisualEditorBlockList );
