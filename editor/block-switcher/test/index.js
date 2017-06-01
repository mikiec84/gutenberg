/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

/**
 * Internal dependencies
 */
import { BlockSwitcher } from '../';
import { createBlock, getBlockType, getBlockTypes, unregisterBlockType, setUnknownTypeHandler, registerBlockType } from 'blocks';

describe( 'BlockSwitcher', () => {
	describe( 'without any registered blocks', () => {
		it( 'should return null without any blocks generated', () => {
			const blockSwitcher = shallow( <BlockSwitcher block={ { name: 'doesnotexist' } } /> );
			// Render returns null when the allowedBlocks list is empty.
			expect( blockSwitcher.equals( null ) ).to.be.true();
		} );
	} );

	describe( 'state management and instance methods', () => {
		it( 'should initialize with state.open being false', () => {
			const blockSwitcher = shallow( <BlockSwitcher block={ { name: 'doesnotexist' } } /> );
			expect( blockSwitcher.state( 'open' ) ).to.be.false();
		} );

		describe( '.toggleMenu()', () => {
			it( 'should toggle state to open when closed', () => {
				const blockSwitcher = shallow( <BlockSwitcher block={ { name: 'doesnotexist' } } /> );
				blockSwitcher.instance().toggleMenu();
				expect( blockSwitcher.state( 'open' ) ).to.be.true();
			} );

			it( 'should toggle state to closed when open', () => {
				const blockSwitcher = shallow( <BlockSwitcher block={ { name: 'doesnotexist' } } /> );
				blockSwitcher.setState( { open: true } );
				blockSwitcher.instance().toggleMenu();
				expect( blockSwitcher.state( 'open' ) ).to.be.false();
			} );
		} );

		describe( '.handleClickOutside()', () => {
			it( 'should return null if the menu is not open', () => {
				const blockSwitcher = shallow(
					<BlockSwitcher block={ { name: 'doesnotexist' } } />
				);
				blockSwitcher.setState( { open: false } );
				expect( blockSwitcher.instance().handleClickOutside() ).to.be.undefined();
			} );

			it( 'should toggle state to closed when open', () => {
				const blockSwitcher = shallow(
					<BlockSwitcher block={ { name: 'doesnotexist' } } />
				);
				blockSwitcher.setState( { open: true } );
				blockSwitcher.instance().handleClickOutside();
				expect( blockSwitcher.state( 'open' ) ).to.be.false();
			} );
		} );

		describe( '.switchBlockType()', () => {
			it( 'should return a function that closes the menu and calls props.onTransform()', () => {
				const name = 'doesnotexist';
				const block = {
					name,
				};
				const destinationName = 'alsodoesnotexist';
				const onTransform = spy();
				const blockSwitcher = shallow(
					<BlockSwitcher block={ block } onTransform={ onTransform } />
				);
				// Set state to open to verify later it closes to avoid false positive.
				blockSwitcher.setState( { open: true } );

				const switchBlockFunction = blockSwitcher.instance().switchBlockType( destinationName );
				expect( switchBlockFunction ).to.be.a( 'function' );

				// Call the function with the destination blockType name already bound.
				switchBlockFunction();
				expect( blockSwitcher.state( 'open' ) ).to.be.false();
				expect( onTransform ).to.have.been.calledOnce();
				expect( onTransform ).to.have.been.calledWith( block, destinationName );
			} );
		} );
	} );

	describe( 'with registered blocks', () => {
		before( () => {
			registerBlockType( 'core/tester-block', {
				icon: 'test',
				transforms: {
					to: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/text-block', {
								value: 'text ' + value,
							} );
						},
					} ],
				},
			} );
			registerBlockType( 'core/text-block', {
				icon: 'text',
				title: 'Text',
			} );
		} );

		after( () => {
			setUnknownTypeHandler( undefined );
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.slug );
			} );
		} );

		describe( 'rendering the menu', () => {
			it( 'should only an IconButton when menu closed with matching props', () => {
				const block = createBlock( 'core/tester-block' );
				const blockSwitcher = shallow( <BlockSwitcher block={ block } /> );
				const switcherMenu = blockSwitcher.find( '.editor-block-switcher__menu' );
				expect( switcherMenu.exists() ).to.be.false();

				// The first IconButton is used to open and close menu.
				const iconButton = blockSwitcher.find( 'IconButton' );
				expect( iconButton.props() ).to.include( {
					className: 'editor-block-switcher__toggle',
					icon: 'test',
					onClick: blockSwitcher.instance().toggleMenu,
					'aria-haspopup': 'true',
					'aria-expanded': false,
					label: 'Change block type',
				} );
			} );

			it( 'should render a menu of IconButtons for blocks to switch to, when open', () => {
				const block = createBlock( 'core/tester-block' );
				const { icon, title } = getBlockType( 'core/text-block' );
				const blockSwitcher = shallow( <BlockSwitcher block={ block } /> );
				// Set the state to open.
				blockSwitcher.setState( { open: true } );

				// The first IconButton is used to open and close menu.
				const mainButton = blockSwitcher.find( 'IconButton' ).first();
				// Aria expanded should trigger when the menu is open.
				expect( mainButton.prop( 'aria-expanded' ) ).to.be.true();

				// Verify menu exists with attributes.
				const switcherMenu = blockSwitcher.find( '.editor-block-switcher__menu' );
				expect( switcherMenu.props() ).to.include( {
					className: 'editor-block-switcher__menu',
					role: 'menu',
					tabIndex: '0',
					'aria-label': 'Block types',
				} );

				const iconButton = switcherMenu.find( 'IconButton' );
				expect( iconButton.props() ).to.include( {
					className: 'editor-block-switcher__menu-item',
					icon: icon,
					role: 'menuitem',
				} );
				expect( iconButton.children().text() ).to.equal( title );
			} );
		} );
	} );
} );
