import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import type { ThreeEvent } from "@react-three/fiber";

import {
  Group,
  Mesh,
  Quaternion,
  Vector3,
} from "three";

import type { LunarSite } from "../../data/lunarSites";

const MOON_PATH = "/model/moon.glb";

const MODEL_SCALE = 1.35;

/*
 * How quickly the Moon turns toward a timeline site.
 *
 * Higher = faster
 * Lower  = slower / more cinematic
 */
const FOCUS_SPEED = 3.2;

/*
 * How much the Moon rotates normally.
 */
const DEFAULT_ROTATION_SPEED = 0.25;

/*
 * Small offset so the selected location does not sit
 * completely dead-centre.
 *
 * 0 = exact centre
 */
const FOCUS_VERTICAL_OFFSET = 0.08;

interface MoonModelProps {
  sites?: LunarSite[];

  selectionMode?: boolean;

  selectedSite?: LunarSite | null;

  /*
   * Site currently controlled by the timeline.
   */
  focusedSite?: LunarSite | null;

  /*
   * True when the History panel is open.
   */
  historyMode?: boolean;

  isInteracting?: boolean;

  autoRotationSpeed?: number;

  onSelectSite?: (
    site: LunarSite
  ) => void;
}

export default function MoonModel({
  sites = [],

  selectionMode = false,

  selectedSite = null,

  focusedSite = null,

  historyMode = false,

  isInteracting = false,

  autoRotationSpeed =
    DEFAULT_ROTATION_SPEED,

  onSelectSite,
}: MoonModelProps) {
  const { scene } =
    useGLTF(MOON_PATH);

  /*
   * Clone the GLB so this component can safely
   * control its own copy.
   */
  const model = useMemo(
    () => scene.clone(true),
    [scene]
  );

  /*
   * This is the actual group that rotates.
   *
   * IMPORTANT:
   * The markers are also children of this group.
   * Therefore rotating this group rotates:
   *
   *       GLB
   *       +
   *       site markers
   *
   * together.
   */
  const rotationGroup =
    useRef<Group | null>(null);

  /*
   * Target quaternion used for cinematic
   * site focusing.
   */
  const targetQuaternion =
    useRef(
      new Quaternion()
    );

  /*
   * Prevent recalculating the same focus
   * repeatedly.
   */
  const previousFocusId =
    useRef<string | number | null>(
      null
    );

  /*
   * Radius used to position site markers
   * just above the Moon surface.
   */
  const markerRadius = useMemo(() => {
    let radius = 0;

    model.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      object.geometry.computeBoundingSphere();

      const bounds =
        object.geometry.boundingSphere;

      if (!bounds) {
        return;
      }

      const scale =
        object.getWorldScale(
          new Vector3()
        );

      const largestScale =
        Math.max(
          scale.x,
          scale.y,
          scale.z
        );

      radius = Math.max(
        radius,
        (
          bounds.center.length() +
          bounds.radius
        ) * largestScale
      );
    });

    return (
      radius *
      MODEL_SCALE *
      1.005
    );
  }, [model]);

  /*
   * =========================================================
   * CONVERT LATITUDE / LONGITUDE TO 3D DIRECTION
   * =========================================================
   *
   * This MUST match the coordinate system you are already
   * using for your markers.
   */
  const getSiteDirection = (
    site: LunarSite
  ): Vector3 | null => {
    if (
      site.latitude === null ||
      site.longitude === null
    ) {
      return null;
    }

    const latitude =
      (site.latitude * Math.PI) /
      180;

    const longitude =
      (site.longitude * Math.PI) /
      180;

    const x =
      Math.cos(latitude) *
      Math.sin(longitude);

    const y =
      Math.sin(latitude);

    const z =
      Math.cos(latitude) *
      Math.cos(longitude);

    return new Vector3(
      x,
      y,
      z
    ).normalize();
  };

  /*
   * =========================================================
   * CREATE TARGET ROTATION
   * =========================================================
   *
   * The camera is looking approximately toward +Z.
   *
   * Therefore:
   *
   *       site direction
   *             ↓
   *            ●
   *           /
   *          /
   *         🌕
   *
   * is rotated so that the site faces:
   *
   *             +Z
   *              ↑
   *              ●
   *              |
   *              🌕
   */
  const calculateFocusRotation = (
    site: LunarSite
  ) => {
    const direction =
      getSiteDirection(site);

    if (!direction) {
      return;
    }

    /*
     * The point on the Moon that should face
     * the viewer.
     */
    const cameraDirection =
      new Vector3(
        0,
        FOCUS_VERTICAL_OFFSET,
        1
      ).normalize();

    const quaternion =
      new Quaternion();

    quaternion.setFromUnitVectors(
      direction,
      cameraDirection
    );

    targetQuaternion.current.copy(
      quaternion
    );
  };

  /*
   * =========================================================
   * WHEN FOCUSED SITE CHANGES
   * =========================================================
   */
  useEffect(() => {
    if (!focusedSite) {
      previousFocusId.current =
        null;

      return;
    }

    /*
     * Sites without coordinates cannot be
     * physically focused on the globe.
     */
    if (
      focusedSite.latitude === null ||
      focusedSite.longitude === null
    ) {
      return;
    }

    /*
     * Don't restart the same focus animation.
     */
    if (
      previousFocusId.current ===
      focusedSite.id
    ) {
      return;
    }

    previousFocusId.current =
      focusedSite.id;

    calculateFocusRotation(
      focusedSite
    );
  }, [focusedSite]);

  /*
   * =========================================================
   * FRAME LOOP
   * =========================================================
   */
  useFrame((_, delta) => {
    const group =
      rotationGroup.current;

    if (!group) {
      return;
    }

    /*
     * -------------------------------------------------------
     * FOCUS MODE
     * -------------------------------------------------------
     *
     * When History changes the focused site,
     * smoothly rotate the entire Moon toward it.
     */
    if (
      focusedSite &&
      !isInteracting
    ) {
      /*
       * Quaternion.slerp gives us a very smooth
       * globe rotation rather than a sudden jump.
       */
      const interpolation =
        1 -
        Math.exp(
          -FOCUS_SPEED * delta
        );

      group.quaternion.slerp(
        targetQuaternion.current,
        interpolation
      );

      return;
    }

    /*
     * -------------------------------------------------------
     * NORMAL AUTO ROTATION
     * -------------------------------------------------------
     *
     * Only rotate automatically when:
     *
     * - no site is being focused
     * - user is not dragging
     */
    if (
      !isInteracting &&
      !selectionMode &&
      !historyMode &&
      autoRotationSpeed !== 0
    ) {
      group.rotation.y +=
        delta *
        autoRotationSpeed;
    }
  });

  return (
    <group ref={rotationGroup}>

      {/* =====================================================
          MOON GLB
          ===================================================== */}

      <primitive
        object={model}
        scale={MODEL_SCALE}
        position={[0, 0, 0]}
      />

      {/* =====================================================
          MISSION SITE MARKERS
          ===================================================== */}

      {sites.map((site) => {
        /*
         * Sites without coordinates cannot have
         * a physical globe marker.
         */
        if (
          site.latitude === null ||
          site.longitude === null
        ) {
          return null;
        }

        const latitude =
          (site.latitude * Math.PI) /
          180;

        const longitude =
          (site.longitude * Math.PI) /
          180;

        /*
         * EXACTLY the same coordinate system
         * your original implementation used.
         */
        const position: [
          number,
          number,
          number
        ] = [
          markerRadius *
            Math.cos(latitude) *
            Math.sin(longitude),

          markerRadius *
            Math.sin(latitude),

          markerRadius *
            Math.cos(latitude) *
            Math.cos(longitude),
        ];

        /*
         * Selected site gets strongest highlight.
         */
        const active =
          selectedSite?.id ===
          site.id;

        /*
         * Timeline-focused site gets a different
         * visual state.
         */
        const focused =
          focusedSite?.id ===
          site.id;

        /*
         * Selected > focused > normal.
         */
        const markerScale =
          active
            ? 2.0
            : focused
              ? 1.65
              : 1;

        const select = (
          event: ThreeEvent<MouseEvent>
        ) => {
          event.stopPropagation();

          if (
            selectionMode
          ) {
            onSelectSite?.(site);
          }
        };

        return (
          <mesh
            key={String(site.id)}
            position={position}
            onClick={
              selectionMode &&
              onSelectSite
                ? select
                : undefined
            }
            scale={markerScale}
          >
            <sphereGeometry
              args={[
                focused
                  ? 0.038
                  : 0.032,
                16,
                16,
              ]}
            />

            <meshBasicMaterial
              color={
                active || focused
                  ? "#ff3b12"
                  : "#A52A2A"
              }
              depthTest
              opacity={
                selectionMode ||
                focused
                  ? 1
                  : 0.75
              }
              transparent={
                !selectionMode &&
                !focused
              }
            />
          </mesh>
        );
      })}
    </group>
  );
}

useGLTF.preload(
  MOON_PATH
);