import { subject } from '@casl/ability';
import {
    assertUnreachable,
    ResourceViewItem,
    ResourceViewItemType,
} from '@lightdash/common';
import { ActionIcon, Box, Menu } from '@mantine/core';
import {
    IconCheck,
    IconChevronRight,
    IconCopy,
    IconDots,
    IconEdit,
    IconFolders,
    IconLayoutGridAdd,
    IconPin,
    IconPinnedOff,
    IconPlus,
    IconTrash,
} from '@tabler/icons-react';
import { FC, Fragment, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSpaceSummaries } from '../../../hooks/useSpaces';
import { useApp } from '../../../providers/AppProvider';
import MantineIcon from '../MantineIcon';
import {
    ResourceViewItemAction,
    ResourceViewItemActionState,
} from './ResourceActionHandlers';

export interface ResourceViewActionMenuCommonProps {
    onAction: (newAction: ResourceViewItemActionState) => void;
}

interface ResourceViewActionMenuProps
    extends ResourceViewActionMenuCommonProps {
    item: ResourceViewItem;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
}

enum SpaceType {
    SharedWithMe,
    AdminContentView,
}

const SpaceTypeLabels = {
    [SpaceType.SharedWithMe]: 'Shared with me',
    [SpaceType.AdminContentView]: 'Admin content view',
};

const ResourceViewActionMenu: FC<ResourceViewActionMenuProps> = ({
    item,
    isOpen,
    onOpen,
    onClose,
    onAction,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(isOpen);
    const { user } = useApp();
    const location = useLocation();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const organizationUuid = user.data?.organizationUuid;
    const { data: spaces = [] } = useSpaceSummaries(projectUuid, true);
    const isPinned = !!item.data.pinnedListUuid;
    const isDashboardPage = location.pathname.includes('/dashboards');

    const [isPinnedLive, setIsPinnedLive] = useState(isPinned);

    useEffect(() => {
        setIsPinnedLive(isPinned);
    }, [isPinned]);

    const spacesSharedWithMe = useMemo(() => {
        return spaces.filter((space) => {
            return user.data && space.access.includes(user.data.userUuid);
        });
    }, [spaces, user.data]);

    const spacesAdminsCanSee = useMemo(() => {
        return spaces.filter((space) => {
            return (
                spacesSharedWithMe.find((s) => s.uuid === space.uuid) ===
                undefined
            );
        });
    }, [spaces, spacesSharedWithMe]);

    const spacesByType = useMemo(() => {
        return {
            [SpaceType.SharedWithMe]: spacesSharedWithMe,
            [SpaceType.AdminContentView]: spacesAdminsCanSee,
        };
    }, [spacesSharedWithMe, spacesAdminsCanSee]);

    switch (item.type) {
        case ResourceViewItemType.CHART:
            if (user.data?.ability?.cannot('manage', 'SavedChart')) {
                return null;
            }
            break;
        case ResourceViewItemType.DASHBOARD:
            if (user.data?.ability?.cannot('manage', 'Dashboard')) {
                return null;
            }
            break;
        case ResourceViewItemType.SPACE:
            if (
                user.data?.ability?.cannot(
                    'manage',
                    subject('Space', {
                        organizationUuid: item.data.organizationUuid,
                        projectUuid,
                    }),
                )
            ) {
                return null;
            }
            break;
        default:
            return assertUnreachable(item, 'Resource type not supported');
    }

    return (
        <Menu
            withinPortal
            opened={isMenuOpen}
            position="bottom-start"
            withArrow
            arrowPosition="center"
            shadow="md"
            offset={-4}
            closeOnItemClick
            closeOnClickOutside
            onClose={() => setIsMenuOpen(false)}
            onOpen={() => setIsMenuOpen(true)}
        >
            <Menu.Target>
                <Box onClick={isMenuOpen ? onClose : onOpen}>
                    <ActionIcon
                        sx={(theme) => ({
                            ':hover': {
                                backgroundColor: theme.colors.gray[1],
                            },
                        })}
                    >
                        <IconDots size={16} />
                    </ActionIcon>
                </Box>
            </Menu.Target>

            <Menu.Dropdown maw={320}>
                <Menu.Item
                    component="button"
                    role="menuitem"
                    icon={<IconEdit size={18} />}
                    onClick={() => {
                        onAction({
                            type: ResourceViewItemAction.UPDATE,
                            item,
                        });
                    }}
                >
                    Rename
                </Menu.Item>

                {item.type === ResourceViewItemType.CHART ||
                item.type === ResourceViewItemType.DASHBOARD ? (
                    <Menu.Item
                        component="button"
                        role="menuitem"
                        icon={<IconCopy size={18} />}
                        onClick={() => {
                            onAction({
                                type: ResourceViewItemAction.DUPLICATE,
                                item,
                            });
                        }}
                    >
                        Duplicate
                    </Menu.Item>
                ) : null}

                {!isDashboardPage && item.type === ResourceViewItemType.CHART && (
                    <Menu.Item
                        component="button"
                        role="menuitem"
                        icon={<IconLayoutGridAdd size={18} />}
                        onClick={() => {
                            onAction({
                                type: ResourceViewItemAction.ADD_TO_DASHBOARD,
                                item,
                            });
                        }}
                    >
                        Add to Dashboard
                    </Menu.Item>
                )}

                {user.data?.ability.can(
                    'manage',
                    subject('PinnedItems', { organizationUuid, projectUuid }),
                ) ? (
                    <Menu.Item
                        component="button"
                        role="menuitem"
                        icon={
                            isPinnedLive ? (
                                <IconPinnedOff size={18} />
                            ) : (
                                <IconPin size={18} />
                            )
                        }
                        onClick={() => {
                            onAction({
                                type: ResourceViewItemAction.PIN_TO_HOMEPAGE,
                                item,
                            });
                            setIsPinnedLive(!isPinnedLive);
                        }}
                    >
                        {isPinnedLive
                            ? 'Unpin from homepage'
                            : 'Pin to homepage'}
                    </Menu.Item>
                ) : null}

                {item.type === ResourceViewItemType.CHART ||
                item.type === ResourceViewItemType.DASHBOARD ? (
                    <>
                        <Menu.Divider />

                        <Menu
                            withinPortal
                            trigger="hover"
                            offset={0}
                            position="right"
                            shadow="md"
                            closeOnItemClick
                        >
                            <Menu.Target>
                                <Menu.Item
                                    component="button"
                                    role="menuitem"
                                    icon={<IconFolders size={18} />}
                                    rightSection={
                                        <Box w={18} h={18} ml="lg">
                                            <IconChevronRight size={18} />
                                        </Box>
                                    }
                                >
                                    Move to Space
                                </Menu.Item>
                            </Menu.Target>

                            <Menu.Dropdown
                                maw={320}
                                mah={400}
                                style={{
                                    overflowY: 'auto',
                                }}
                            >
                                {[
                                    SpaceType.SharedWithMe,
                                    SpaceType.AdminContentView,
                                ].map((spaceType) => (
                                    <Fragment key={spaceType}>
                                        {spacesByType[
                                            SpaceType.AdminContentView
                                        ].length > 0 ? (
                                            <>
                                                {spaceType ===
                                                SpaceType.AdminContentView ? (
                                                    <Menu.Divider />
                                                ) : null}

                                                <Menu.Label>
                                                    {SpaceTypeLabels[spaceType]}
                                                </Menu.Label>
                                            </>
                                        ) : null}

                                        {spacesByType[spaceType].map(
                                            (space) => (
                                                <Menu.Item
                                                    key={space.uuid}
                                                    role="menuitem"
                                                    disabled={
                                                        item.data.spaceUuid ===
                                                        space.uuid
                                                    }
                                                    icon={
                                                        item.data.spaceUuid ===
                                                        space.uuid ? (
                                                            <IconCheck
                                                                size={18}
                                                            />
                                                        ) : (
                                                            <Box
                                                                w={18}
                                                                h={18}
                                                            />
                                                        )
                                                    }
                                                    component="button"
                                                    onClick={() => {
                                                        // TODO: remove when #6626 is closed
                                                        console.log(
                                                            '--------------------',
                                                        );
                                                        console.log(
                                                            'onClick in ResourceActionMenu',
                                                        );
                                                        console.log(
                                                            'item.data.spaceUuid',
                                                            item.data.spaceUuid,
                                                        );
                                                        console.log(
                                                            'space.uuid',
                                                            space.uuid,
                                                        );
                                                        console.log(
                                                            '====================',
                                                        );
                                                        if (
                                                            item.data
                                                                .spaceUuid !==
                                                            space.uuid
                                                        ) {
                                                            onAction({
                                                                type: ResourceViewItemAction.MOVE_TO_SPACE,
                                                                item,
                                                                data: {
                                                                    ...item.data,
                                                                    spaceUuid:
                                                                        space.uuid,
                                                                },
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {space.name}
                                                </Menu.Item>
                                            ),
                                        )}
                                    </Fragment>
                                ))}

                                {spaces.length > 0 ? <Menu.Divider /> : null}

                                <Menu.Item
                                    component="button"
                                    role="menuitem"
                                    icon={
                                        <MantineIcon
                                            icon={IconPlus}
                                            size={18}
                                        />
                                    }
                                    onClick={() => {
                                        onAction({
                                            type: ResourceViewItemAction.CREATE_SPACE,
                                            item,
                                        });
                                    }}
                                >
                                    Create new space
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </>
                ) : null}

                <Menu.Divider />

                <Menu.Item
                    component="button"
                    role="menuitem"
                    color="red"
                    icon={<MantineIcon icon={IconTrash} size={18} />}
                    onClick={() => {
                        onAction({
                            type: ResourceViewItemAction.DELETE,
                            item,
                        });
                    }}
                >
                    Delete {item.type}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export default ResourceViewActionMenu;
